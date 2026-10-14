import type { payments } from '@/db/schema';
import type { CarePlan } from './plans';

type Payment = typeof payments.$inferSelect;
const clock = (date: Date) => date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

// Where a paid order has got to, as the stage and labels the order diorama shows. Orders
// cancelled before pickup have no diorama.
export function orderStage(payment: Payment, plan: CarePlan) {
  if (!payment.collectedAt && payment.status !== 'ready_for_pickup') return undefined;
  const amount = `$${payment.amountUsd}`;
  return {
    stage: (payment.collectedAt ? 2 : 1) as 1 | 2,
    places: { us: `You · ${clock(payment.paidAt)}`, ng: plan.merchantCity },
    stages: [
      { us: `Paying ${plan.merchantName} · ${amount}`, ng: 'Order on its way' },
      { us: `Paid ${amount}`, ng: 'Ready for pickup' },
      {
        us: `${plan.beneficiary} picked it up${payment.collectedAt ? ` · ${clock(payment.collectedAt)}` : ''}`,
        ng: 'Picked up',
      },
    ],
  };
}
