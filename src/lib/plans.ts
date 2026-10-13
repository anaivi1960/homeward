import { randomBytes, randomInt } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { carePlans, payments, type PlanItem } from '@/db/schema';
import { getMerchant } from './merchants';

// Placeholder rate for the naira estimate shown beside USD amounts; not a live quote.
const DEMO_NGN_PER_USD = 1520;

// What the plan card needs: the stored plan plus its merchant's display details.
export type CarePlan = {
  id: string;
  beneficiary: string;
  merchantId: string;
  merchantName: string;
  merchantCity: string;
  merchantCategory: string;
  items: PlanItem[];
  amountUsd: string;
  nairaEstimate: string;
  status: 'awaiting_approval' | 'paid';
};

function withMerchant(row: typeof carePlans.$inferSelect): CarePlan {
  const merchant = getMerchant(row.merchantId);
  return {
    id: row.id,
    beneficiary: row.beneficiary,
    merchantId: row.merchantId,
    merchantName: merchant?.name ?? row.merchantId,
    merchantCity: merchant?.city ?? '',
    merchantCategory: merchant?.category ?? '',
    items: row.items,
    amountUsd: row.amountUsd,
    nairaEstimate: row.nairaEstimate,
    status: row.status,
  };
}

export type DraftInput = {
  beneficiary: string;
  merchantId: string;
  items: { sku: string; quantity: number }[];
};

// Prices come from the merchant's catalog, never from the model.
export async function draftPlan(input: DraftInput): Promise<CarePlan | { error: string }> {
  const merchant = getMerchant(input.merchantId);
  if (!merchant) return { error: 'That merchant is not in the directory.' };

  let total = 0;
  const items: PlanItem[] = [];
  for (const line of input.items) {
    const item = merchant.catalog.find((c) => c.sku === line.sku);
    if (!item) return { error: `${merchant.name} does not sell "${line.sku}".` };
    const lineTotal = item.priceUsd * line.quantity;
    total += lineTotal;
    items.push({ name: item.name, quantity: line.quantity, lineUsd: lineTotal.toFixed(2) });
  }

  const [row] = await db
    .insert(carePlans)
    .values({
      beneficiary: input.beneficiary,
      merchantId: merchant.id,
      items,
      amountUsd: total.toFixed(2),
      nairaEstimate: (Math.round((total * DEMO_NGN_PER_USD) / 100) * 100).toLocaleString('en-NG'),
    })
    .returning();
  return withMerchant(row);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPlan(id: string | undefined) {
  if (!id || !UUID.test(id)) return undefined;
  const [row] = await db.select().from(carePlans).where(eq(carePlans.id, id));
  return row && withMerchant(row);
}

// No 0/O or 1/I, so a code read aloud or off a phone is unambiguous.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newPickupCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

// Records a captured PayPal order once; a repeat call for the same order returns the first record.
export async function recordPayment(plan: CarePlan, paypalOrderId: string, amountUsd: string) {
  await db
    .insert(payments)
    .values({
      planId: plan.id,
      merchantId: plan.merchantId,
      paypalOrderId,
      amountUsd,
      pickupCode: newPickupCode(),
      beneficiaryToken: randomBytes(16).toString('hex'),
    })
    .onConflictDoNothing({ target: payments.paypalOrderId });
  await db.update(carePlans).set({ status: 'paid' }).where(eq(carePlans.id, plan.id));
  const [payment] = await db.select().from(payments).where(eq(payments.paypalOrderId, paypalOrderId));
  return payment;
}

const paymentWithPlan = () =>
  db.select({ payment: payments, plan: carePlans }).from(payments).innerJoin(carePlans, eq(payments.planId, carePlans.id));

export async function getPaymentByToken(token: string) {
  const [row] = await paymentWithPlan().where(eq(payments.beneficiaryToken, token));
  return row && { payment: row.payment, plan: withMerchant(row.plan) };
}

export async function listPayments(merchantId?: string) {
  const query = paymentWithPlan();
  const rows = await (merchantId ? query.where(eq(payments.merchantId, merchantId)) : query).orderBy(desc(payments.paidAt));
  return rows.map((row) => ({ payment: row.payment, plan: withMerchant(row.plan) }));
}

// The merchant confirms handover by entering the beneficiary's pickup code.
export async function confirmPickup(merchantId: string, paymentId: string, code: string) {
  if (!UUID.test(paymentId)) return false;
  const updated = await db
    .update(payments)
    .set({ status: 'collected', collectedAt: new Date() })
    .where(
      and(
        eq(payments.id, paymentId),
        eq(payments.merchantId, merchantId),
        eq(payments.pickupCode, code.trim().toUpperCase()),
        eq(payments.status, 'ready_for_pickup'),
      ),
    )
    .returning({ id: payments.id });
  return updated.length === 1;
}
