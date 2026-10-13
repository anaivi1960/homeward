import type { CarePlan } from '@/lib/plans';

export function PlanCard({ plan }: { plan: CarePlan }) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold tracking-tight">{plan.merchantName}</p>
          <p className="label mt-1 text-text-muted">
            {plan.merchantCity} · <span className="text-accent">Verified pharmacy</span>
          </p>
        </div>
        <span className="label shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-text-muted">
          Awaiting approval
        </span>
      </div>

      <p className="label mt-6 text-text-muted">For {plan.beneficiary}</p>
      <ul className="mt-2 divide-y divide-border border-y border-border text-sm">
        {plan.items.map((item) => (
          <li key={item.name} className="flex justify-between gap-4 py-2.5">
            <span>
              {item.name} <span className="text-text-muted">× {item.quantity}</span>
            </span>
            <span className="font-mono tabular-nums">${item.lineUsd}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="amount text-[44px] leading-[44px] font-semibold">${plan.amountUsd}</p>
          <p className="label mt-1.5 text-text-muted">USD · about ₦{plan.nairaEstimate}</p>
        </div>
      </div>

      <form action="/api/orders" method="post" className="mt-5">
        <input type="hidden" name="planId" value={plan.id} />
        <button type="submit" className="btn w-full">
          Approve with PayPal
        </button>
        <p className="mt-3 text-center text-xs text-text-muted">
          You&rsquo;ll pay {plan.merchantName} ${plan.amountUsd} USD. {plan.beneficiary} collects with a pickup code.
        </p>
      </form>
    </section>
  );
}
