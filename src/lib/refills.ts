import { and, desc, eq, isNull, lte, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { carePlans, payments, refills } from '@/db/schema';
import { getMerchant } from './merchants';
import { draftPlan, UUID } from './plans';

// Repeat orders for medicine taken every month. Homeward never pays by itself: when a refill is
// due it drafts a new order from the same items at today's catalog prices, and the payer approves
// it with PayPal like any other order.
const draft = alias(carePlans, 'draft');

export async function startRefill(paymentId: string, everyDays = 30) {
  if (!UUID.test(paymentId)) return false;
  const [row] = await db
    .select({ plan: carePlans, paidAt: payments.paidAt })
    .from(payments)
    .innerJoin(carePlans, eq(payments.planId, carePlans.id))
    .where(eq(payments.id, paymentId));
  if (!row) return false;
  const created = await db
    .insert(refills)
    .values({
      sourcePlanId: row.plan.id,
      beneficiary: row.plan.beneficiary,
      merchantId: row.plan.merchantId,
      items: row.plan.items,
      everyDays,
      nextDue: new Date(row.paidAt.getTime() + everyDays * 86_400_000),
    })
    .onConflictDoUpdate({ target: refills.sourcePlanId, set: { active: true } })
    .returning({ id: refills.id });
  return created.length === 1;
}

export async function stopRefill(refillId: string) {
  if (!UUID.test(refillId)) return false;
  await db.update(refills).set({ active: false }).where(eq(refills.id, refillId));
  return true;
}

// Drafts the next order for every refill that is due and has no unpaid draft waiting. `now` lets
// the payer prepare one early ("Prepare it now").
export async function draftDueRefills(now?: string) {
  const due = await db
    .select({ refill: refills, draftStatus: draft.status })
    .from(refills)
    .leftJoin(draft, eq(refills.draftPlanId, draft.id))
    .where(
      and(
        eq(refills.active, true),
        now && UUID.test(now) ? eq(refills.id, now) : lte(refills.nextDue, new Date()),
        or(isNull(refills.draftPlanId), eq(draft.status, 'paid')),
      ),
    );

  for (const { refill } of due) {
    const merchant = getMerchant(refill.merchantId);
    const items = refill.items
      .map((item) => ({ sku: merchant?.catalog.find((c) => c.name === item.name)?.sku, quantity: item.quantity }))
      .filter((item): item is { sku: string; quantity: number } => Boolean(item.sku));
    if (!merchant || items.length === 0) continue;
    const plan = await draftPlan({ beneficiary: refill.beneficiary, merchantId: merchant.id, items });
    if ('error' in plan) continue;
    const from = Math.max(refill.nextDue.getTime(), Date.now());
    await db
      .update(refills)
      .set({ draftPlanId: plan.id, nextDue: new Date(from + refill.everyDays * 86_400_000) })
      .where(eq(refills.id, refill.id));
  }
}

export async function listRefills() {
  const rows = await db
    .select({ refill: refills, draft: { id: draft.id, status: draft.status, amountUsd: draft.amountUsd } })
    .from(refills)
    .leftJoin(draft, eq(refills.draftPlanId, draft.id))
    .where(eq(refills.active, true))
    .orderBy(desc(refills.createdAt));
  return rows.map(({ refill, draft }) => ({
    ...refill,
    merchantName: getMerchant(refill.merchantId)?.name ?? refill.merchantId,
    // An order drafted and not yet paid, waiting for the payer's approval.
    waiting: draft?.id && draft.status === 'awaiting_approval' ? { planId: draft.id, amountUsd: draft.amountUsd } : undefined,
  }));
}

export async function refilledPlanIds() {
  const rows = await db.select({ id: refills.sourcePlanId }).from(refills).where(eq(refills.active, true));
  return new Set(rows.map((r) => r.id));
}
