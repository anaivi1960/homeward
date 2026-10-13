import { randomUUID } from 'node:crypto';
import { getMerchant } from './merchants';

// Placeholder rate for the naira estimate shown beside USD amounts; not a live quote.
const DEMO_NGN_PER_USD = 1520;

export type CarePlan = {
  id: string;
  beneficiary: string;
  merchantId: string;
  merchantName: string;
  merchantCity: string;
  merchantCategory: string;
  items: { name: string; quantity: number; lineUsd: string }[];
  amountUsd: string;
  nairaEstimate: string;
  status: 'awaiting_approval' | 'paid';
  paypalOrderId?: string;
};

// In-memory until the database lands; survives hot reloads in dev via globalThis.
const store: Map<string, CarePlan> = ((globalThis as { __plans?: Map<string, CarePlan> }).__plans ??= new Map());

export type DraftInput = {
  beneficiary: string;
  merchantId: string;
  items: { sku: string; quantity: number }[];
};

// Prices come from the merchant's catalog, never from the model.
export function draftPlan(input: DraftInput): CarePlan | { error: string } {
  const merchant = getMerchant(input.merchantId);
  if (!merchant) return { error: 'That merchant is not in the directory.' };

  let total = 0;
  const items: CarePlan['items'] = [];
  for (const line of input.items) {
    const item = merchant.catalog.find((c) => c.sku === line.sku);
    if (!item) return { error: `${merchant.name} does not sell "${line.sku}".` };
    const lineTotal = item.priceUsd * line.quantity;
    total += lineTotal;
    items.push({ name: item.name, quantity: line.quantity, lineUsd: lineTotal.toFixed(2) });
  }

  const plan: CarePlan = {
    id: randomUUID(),
    beneficiary: input.beneficiary,
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantCity: merchant.city,
    merchantCategory: merchant.category,
    items,
    amountUsd: total.toFixed(2),
    nairaEstimate: (Math.round((total * DEMO_NGN_PER_USD) / 100) * 100).toLocaleString('en-NG'),
    status: 'awaiting_approval',
  };
  store.set(plan.id, plan);
  return plan;
}

export const getPlan = (id: string | undefined) => (id ? store.get(id) : undefined);

export function markPaid(id: string, paypalOrderId: string) {
  const plan = store.get(id);
  if (plan) store.set(id, { ...plan, status: 'paid', paypalOrderId });
}
