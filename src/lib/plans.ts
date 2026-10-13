import { randomBytes, randomInt } from 'node:crypto';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { carePlans, payments, type PlanItem, type ProblemReason, problemReasons, problemReports } from '@/db/schema';
import { getMerchant } from './merchants';
import { appUrl, notify, type OrderEvent } from './notify';
import { captureOrder, getCapture, getOrder } from './paypal';

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

// Tells the Zapier hook about an order event, with enough detail to write a message from.
async function announce(event: OrderEvent, paymentId: string, extra: Record<string, unknown> = {}) {
  if (!process.env.ZAPIER_HOOK_URL) return;
  const [row] = await paymentWithPlan().where(eq(payments.id, paymentId));
  if (!row) return;
  const plan = withMerchant(row.plan);
  await notify(event, {
    orderId: row.payment.id,
    paypalOrderId: row.payment.paypalOrderId,
    status: row.payment.status,
    beneficiary: plan.beneficiary,
    pharmacy: plan.merchantName,
    city: plan.merchantCity,
    items: plan.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
    amountUsd: row.payment.amountUsd,
    pickupUrl: `${appUrl()}/b/${row.payment.beneficiaryToken}`,
    pharmacyUrl: `${appUrl()}/merchant/${row.payment.merchantId}`,
    ...extra,
  });
}

// Records a captured PayPal order once; a repeat call for the same order returns the first record.
export async function recordPayment(plan: CarePlan, paypalOrderId: string, amountUsd: string) {
  const created = await db
    .insert(payments)
    .values({
      planId: plan.id,
      merchantId: plan.merchantId,
      paypalOrderId,
      amountUsd,
      pickupCode: newPickupCode(),
      beneficiaryToken: randomBytes(16).toString('hex'),
    })
    .onConflictDoNothing({ target: payments.paypalOrderId })
    .returning({ id: payments.id });
  if (created.length) await announce('order.paid', created[0].id);
  await db.update(carePlans).set({ status: 'paid' }).where(eq(carePlans.id, plan.id));
  const [payment] = await db.select().from(payments).where(eq(payments.paypalOrderId, paypalOrderId));
  return payment;
}

// Captures an approved PayPal order and records the payment. Safe to repeat: the return page
// and the webhook can both call it for the same order.
export async function settleOrder(orderId: string) {
  const capture = await captureOrder(orderId);
  // A second capture is refused; fall back to the stored order instead of failing.
  const order = capture.ok ? capture.body : (await getOrder(orderId)).body;
  if (order.status !== 'COMPLETED') return undefined;

  const unit = order.purchase_units?.[0];
  const captured = unit?.payments?.captures?.[0];
  const plan = await getPlan(unit?.reference_id);
  const payment = plan && (await recordPayment(plan, order.id, captured?.amount?.value ?? plan.amountUsd));
  return { order, captured, plan, payment };
}

// A refunded order can no longer be collected: confirmPickup only accepts ready_for_pickup.
export async function markRefunded(paypalOrderId: string) {
  const updated = await db
    .update(payments)
    .set({ status: 'refunded' })
    .where(and(eq(payments.paypalOrderId, paypalOrderId), ne(payments.status, 'refunded')))
    .returning({ id: payments.id });
  if (updated.length) await announce('order.refunded', updated[0].id);
}

// The payer cancels before pickup. The code stops working at once; the money comes back when
// the pharmacy refunds it, because PayPal only lets the account that was paid send a refund.
export async function requestCancel(paymentId: string) {
  if (!UUID.test(paymentId)) return false;
  const updated = await db
    .update(payments)
    .set({ status: 'refund_due' })
    .where(and(eq(payments.id, paymentId), eq(payments.status, 'ready_for_pickup')))
    .returning({ id: payments.id });
  if (updated.length) await announce('order.cancel_requested', updated[0].id);
  return updated.length === 1;
}

// The pharmacy says it has refunded; believe PayPal, not the button.
export async function checkRefund(merchantId: string, paymentId: string) {
  if (!UUID.test(paymentId)) return false;
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.merchantId, merchantId), eq(payments.status, 'refund_due')));
  if (!payment) return false;

  const order = await getOrder(payment.paypalOrderId);
  const captureId = order.body.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  const capture = captureId && (await getCapture(captureId));
  if (!capture || capture.body.status !== 'REFUNDED') return false;
  await markRefunded(payment.paypalOrderId);
  return true;
}

export type ReportInput = {
  paymentId: string;
  reportedBy: 'payer' | 'beneficiary';
  reason: ProblemReason;
  details: string;
};

// One report per order, and only once the medicine has been picked up.
export async function reportProblem(input: ReportInput) {
  if (!UUID.test(input.paymentId) || !(input.reason in problemReasons)) return false;
  const [payment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.id, input.paymentId), eq(payments.status, 'collected')));
  if (!payment) return false;
  const created = await db
    .insert(problemReports)
    .values({ ...input, details: input.details.trim().slice(0, 1000) })
    .onConflictDoNothing({ target: problemReports.paymentId })
    .returning({ id: problemReports.id });
  if (created.length) await announce('problem.reported', input.paymentId, { reason: problemReasons[input.reason], details: input.details });
  return created.length === 1;
}

// The pharmacy answers a report by replacing the medicine or agreeing to refund it.
export async function resolveProblem(merchantId: string, reportId: string, answer: 'replaced' | 'refund') {
  if (!UUID.test(reportId)) return false;
  const [row] = await db
    .select({ paymentId: payments.id })
    .from(problemReports)
    .innerJoin(payments, eq(problemReports.paymentId, payments.id))
    .where(and(eq(problemReports.id, reportId), eq(problemReports.status, 'open'), eq(payments.merchantId, merchantId)));
  if (!row) return false;

  await db.update(problemReports).set({ status: answer, resolvedAt: new Date() }).where(eq(problemReports.id, reportId));
  if (answer === 'refund') await db.update(payments).set({ status: 'refund_due' }).where(eq(payments.id, row.paymentId));
  await announce('problem.answered', row.paymentId, { answer });
  return true;
}

const paymentWithPlan = () =>
  db
    .select({ payment: payments, plan: carePlans, report: problemReports })
    .from(payments)
    .innerJoin(carePlans, eq(payments.planId, carePlans.id))
    .leftJoin(problemReports, eq(problemReports.paymentId, payments.id));

export async function getPaymentByToken(token: string) {
  const [row] = await paymentWithPlan().where(eq(payments.beneficiaryToken, token));
  return row && { payment: row.payment, plan: withMerchant(row.plan), report: row.report };
}

export async function listPayments(merchantId?: string) {
  const query = paymentWithPlan();
  const rows = await (merchantId ? query.where(eq(payments.merchantId, merchantId)) : query).orderBy(desc(payments.paidAt));
  return rows.map((row) => ({ payment: row.payment, plan: withMerchant(row.plan), report: row.report }));
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
  if (updated.length) await announce('order.picked_up', paymentId);
  return updated.length === 1;
}
