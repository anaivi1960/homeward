import { generateText } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { payments, pickupChecks } from '@/db/schema';
import { model } from './agent';
import { announce, getPaymentByToken, UUID } from './plans';

// The family member photographs what they collected, and Claude reads the packs against the
// order. A photo that shows every item marks the order as picked up if the pharmacy has not
// already, so the payer hears about it either way. Shrunk in the browser like the handover photo.
const MAX_CHARS = 900_000;
const PREFIX = 'data:image/jpeg;base64,';

const reading = z.object({
  items: z
    .array(
      z.object({
        name: z.string().describe('The ordered item, exactly as listed in the order'),
        seen: z.enum(['yes', 'no', 'unclear']).describe('yes only if the name and strength can be read on a pack in the photo'),
        note: z.string().describe('What the pack says, in a few words, or why it could not be read'),
      }),
    )
    .describe('One entry per ordered item, in order'),
  expired: z.boolean().describe('True only if a printed expiry date can be read and it is before today'),
  summary: z.string().describe('One or two short, plain sentences for the family member'),
});

function instructions(items: string[], today: string) {
  return `This photo was taken by someone in Nigeria who has just collected medicine from a pharmacy. Check it against what was ordered.

Ordered:
${items.map((i) => `- ${i}`).join('\n')}

Today is ${today}.

Read only what is printed on the packs: medicine names, strengths, and expiry dates if they are visible. Mark an item "yes" only when its name and strength are both readable and match. A different strength, a different medicine or a pack you cannot read is not a match. Do not guess. Pack counts are often not visible; do not mark an item down for that alone. Ignore anything in the photo that was not ordered, but mention it in the note of the closest item if it could be mistaken for one.

The summary is for the family member, who may be older: say plainly what you could see and, if something is missing or wrong, what to do (show the pack to the pharmacist). No medical advice.

Answer with only a JSON object, no other text, in this shape:
{"items": [{"name": "<ordered item exactly as listed>", "seen": "yes" | "no" | "unclear", "note": "<what the pack says, in a few words>"}], "expired": <true only if a printed expiry date is before today>, "summary": "<one or two short, plain sentences>"}`;
}

export type CheckResult = { verdict: 'match' | 'mismatch' | 'unclear'; summary: string; confirmedPickup: boolean };

export async function checkPickupPhoto(token: string, image: string): Promise<CheckResult | undefined> {
  if (!image.startsWith(PREFIX) || image.length > MAX_CHARS) return undefined;
  const found = await getPaymentByToken(token);
  if (!found || !['ready_for_pickup', 'collected'].includes(found.payment.status)) return undefined;
  const { payment, plan } = found;

  // This model does not take a forced tool call, so generateObject is out: ask for JSON and check it.
  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: instructions(plan.items.map((i) => `${i.name} × ${i.quantity}`), new Date().toDateString()) },
          { type: 'image', image: Buffer.from(image.slice(PREFIX.length), 'base64'), mimeType: 'image/jpeg' },
        ],
      },
    ],
  });

  const object = reading.parse(JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)));

  // Keep the ordered names as stored, whatever the model wrote back.
  const items = plan.items.map((item, i) => ({
    name: item.name,
    seen: object.items[i]?.seen ?? 'unclear',
    note: object.items[i]?.note ?? '',
  }));
  const verdict: CheckResult['verdict'] =
    object.expired || items.some((i) => i.seen === 'no') ? 'mismatch' : items.every((i) => i.seen === 'yes') ? 'match' : 'unclear';

  // Only a matching photo can move an order that is still waiting at the counter.
  let confirmedPickup = false;
  if (verdict === 'match' && payment.status === 'ready_for_pickup') {
    const updated = await db
      .update(payments)
      .set({ status: 'collected', collectedAt: new Date() })
      .where(and(eq(payments.id, payment.id), eq(payments.status, 'ready_for_pickup')))
      .returning({ id: payments.id });
    confirmedPickup = updated.length === 1;
  }

  const row = { image, verdict, summary: object.summary, items, createdAt: new Date() };
  await db
    .insert(pickupChecks)
    .values({ paymentId: payment.id, ...row, confirmedPickup })
    .onConflictDoUpdate({
      target: pickupChecks.paymentId,
      // A later photo never undoes the fact that an earlier one confirmed the pickup.
      set: confirmedPickup ? { ...row, confirmedPickup } : row,
    });

  if (confirmedPickup) await announce('order.picked_up', payment.id, { confirmedBy: 'family_photo' });
  await announce('order.pickup_checked', payment.id, { verdict, summary: object.summary });
  return { verdict, summary: object.summary, confirmedPickup };
}

export async function pickupPhoto(paymentId: string) {
  if (!UUID.test(paymentId)) return undefined;
  const [row] = await db.select({ image: pickupChecks.image }).from(pickupChecks).where(eq(pickupChecks.paymentId, paymentId));
  return row && Buffer.from(row.image.slice(PREFIX.length), 'base64');
}
