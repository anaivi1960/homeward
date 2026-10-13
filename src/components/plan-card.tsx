import type { CarePlan } from '@/lib/plans';

export function PlanCard({ plan }: { plan: CarePlan }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{plan.merchantName}</p>
          <p className="text-sm text-text-muted">
            {plan.merchantCity} · <span className="capitalize">{plan.merchantCategory}</span>
            <span className="ml-2 text-success">✓ Verified</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-warning">
          ◷ Awaiting approval
        </span>
      </div>

      <p className="mt-4 text-sm text-text-muted">
        For <span className="font-medium text-accent">{plan.beneficiary}</span>
      </p>
      <ul className="mt-2 border-t border-border pt-3 text-sm">
        {plan.items.map((item) => (
          <li key={item.name} className="flex justify-between gap-4 py-0.5">
            <span>
              {item.name} <span className="text-text-muted">× {item.quantity}</span>
            </span>
            <span className="tabular-nums">${item.lineUsd}</span>
          </li>
        ))}
      </ul>

      <p className="amount mt-5 text-[44px] leading-[48px] font-semibold">${plan.amountUsd}</p>
      <p className="text-sm text-text-muted">about ₦{plan.nairaEstimate}</p>

      <form action="/api/orders" method="post" className="mt-5">
        <input type="hidden" name="planId" value={plan.id} />
        <p className="mb-3 text-sm text-text-muted">
          You&rsquo;ll pay {plan.merchantName} ${plan.amountUsd} USD through PayPal.
        </p>
        <button
          type="submit"
          className="min-h-11 w-full rounded-control bg-primary px-4 font-semibold text-on-primary"
        >
          Approve with PayPal
        </button>
      </form>
    </section>
  );
}
