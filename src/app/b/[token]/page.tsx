import { notFound } from 'next/navigation';
import { formatTime, StatusChip } from '@/components/status-chip';
import { getPaymentByToken } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// The beneficiary opens this from a link; no login.
export default async function BeneficiaryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getPaymentByToken(token);
  if (!found) notFound();
  const { payment, plan } = found;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-6 p-4 py-12">
      <p className="font-display text-xl font-semibold text-primary">Homeward</p>
      <h1 className="font-display text-[32px] leading-[38px] font-semibold">
        {payment.status === 'collected' ? 'Collected. Thank you.' : `Your order at ${plan.merchantName} is paid for.`}
      </h1>

      <section className="rounded-card border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{plan.merchantName}</p>
            <p className="text-sm text-text-muted">{plan.merchantCity}</p>
          </div>
          <StatusChip status={payment.status} />
        </div>
        <ul className="mt-4 border-t border-border pt-3 text-sm">
          {plan.items.map((item) => (
            <li key={item.name}>
              {item.name} <span className="text-text-muted">× {item.quantity}</span>
            </li>
          ))}
        </ul>

        {payment.status === 'ready_for_pickup' ? (
          <>
            <p className="mt-6 text-sm text-text-muted">Show this code when you collect</p>
            <p className="mt-1 font-mono text-[44px] leading-[48px] font-medium tracking-[0.2em] text-accent">
              {payment.pickupCode}
            </p>
            <p className="mt-3 text-sm text-text-muted">Nothing to pay. Do not share the code with anyone else.</p>
          </>
        ) : (
          <p className="mt-6 text-sm text-text-muted">
            Collected {payment.collectedAt && formatTime(payment.collectedAt)}.
          </p>
        )}
      </section>
    </main>
  );
}
