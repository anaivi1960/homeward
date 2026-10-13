import Link from 'next/link';
import { formatTime, StatusChip } from '@/components/status-chip';
import { listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// Payer timeline. Single demo payer for now, so this lists every payment.
export default async function Payments() {
  const rows = await listPayments();

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-6 p-4 py-12">
      <header>
        <Link href="/" className="font-display text-xl font-semibold text-primary">
          Homeward
        </Link>
        <h1 className="mt-6 font-display text-[32px] leading-[38px] font-semibold">What you&rsquo;ve covered</h1>
      </header>

      {rows.length === 0 && (
        <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
          Nothing yet. Payments appear here once you approve a plan.
        </p>
      )}

      {rows.map(({ payment, plan }) => (
        <section key={payment.id} className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                {plan.merchantName} · for <span className="text-accent">{plan.beneficiary}</span>
              </p>
              <p className="text-sm text-text-muted">{plan.items.map((i) => i.name).join(', ')}</p>
            </div>
            <StatusChip status={payment.status} />
          </div>
          <p className="amount mt-3 text-2xl font-semibold">${payment.amountUsd}</p>
          <ol className="mt-3 border-t border-border pt-3 text-sm text-text-muted">
            <li>Paid {formatTime(payment.paidAt)}</li>
            <li>
              {payment.collectedAt
                ? `${plan.beneficiary} collected it ${formatTime(payment.collectedAt)}`
                : `Waiting for ${plan.beneficiary} to collect`}
            </li>
          </ol>
          <p className="mt-2 font-mono text-xs text-text-muted">PayPal order {payment.paypalOrderId}</p>
        </section>
      ))}
    </main>
  );
}
