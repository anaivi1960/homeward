import type { CarePlan } from '@/lib/plans';
import { AllowanceMeter } from './allowance-meter';

export function PlanCard({ plan }: { plan: CarePlan }) {
  const amount = Number(plan.amountUsd);
  const allowance = plan.allowance;
  // An order over what is left of the month's allowance needs one more deliberate tick.
  const over = allowance && amount > allowance.remainingUsd ? amount - allowance.remainingUsd : 0;

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

      {allowance && (
        <div className={`mt-5 rounded-control p-4 text-sm ${over ? 'border border-warning bg-warning/5' : 'bg-surface-muted'}`}>
          <AllowanceMeter allowance={allowance} adding={amount} />
          <p className={`mt-2 ${over ? 'text-warning' : 'text-text-muted'}`}>
            {over
              ? `This is $${over.toFixed(2)} over what is left of ${allowance.beneficiary}'s monthly allowance.`
              : `Within ${allowance.beneficiary}'s monthly allowance.`}
          </p>
        </div>
      )}

      <form action="/api/orders" method="post" className="mt-5">
        <input type="hidden" name="planId" value={plan.id} />
        {over > 0 && (
          <label className="mb-4 flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-0.5 size-4 accent-(--primary)" />
            <span>I want to go over {allowance!.beneficiary}&rsquo;s allowance for this order.</span>
          </label>
        )}
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
