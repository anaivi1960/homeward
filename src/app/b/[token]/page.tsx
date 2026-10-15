import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { OrderScene } from '@/components/order-scene';
import { Brand } from '@/components/brand';
import { ReportForm, ReportStatus } from '@/components/problem-report';
import { formatTime, StatusChip } from '@/components/status-chip';
import { orderStage } from '@/lib/order-stage';
import { getPaymentByToken } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// The family member opens this from a link; no login.
export default async function BeneficiaryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getPaymentByToken(token);
  if (!found) notFound();
  const { payment, plan, report } = found;
  const scene = orderStage(payment, plan);
  const pickedUp = Boolean(payment.collectedAt);
  // Cancelled by the payer before pickup, whether or not the refund has arrived yet.
  const cancelled = !pickedUp && payment.status !== 'ready_for_pickup';

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col gap-4 p-4 py-8">
      <AutoRefresh />
      <Brand />
      <h1 className="mt-8 text-[36px] leading-[1.05] font-semibold">
        {pickedUp ? 'Picked up. Thank you.' : cancelled ? 'This order was cancelled.' : 'Your medicine is paid for.'}
      </h1>

      {scene && (
        <OrderScene {...scene} places={{ us: 'Paid from abroad', ng: scene.places.ng }} className="h-[240px]" />
      )}

      <section className="card mt-2 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold tracking-tight">{plan.merchantName}</p>
            <p className="label mt-1 text-text-muted">{plan.merchantCity}</p>
          </div>
          <StatusChip status={payment.status} />
        </div>
        <ul className="mt-5 divide-y divide-border border-y border-border text-sm">
          {plan.items.map((item) => (
            <li key={item.name} className="py-2.5">
              {item.name} <span className="text-text-muted">× {item.quantity}</span>
            </li>
          ))}
        </ul>

        {pickedUp ? (
          <>
            <p className="mt-5 text-sm text-text-muted">
              Picked up {payment.collectedAt && formatTime(payment.collectedAt)}.
            </p>
            <div className="mt-5">
              {report ? (
                <ReportStatus report={report} pharmacy={plan.merchantName} />
              ) : (
                payment.status === 'collected' && (
                  <ReportForm hidden={{ name: 'token', value: token }} summary="Something wrong with the medicine?" />
                )
              )}
            </div>
          </>
        ) : cancelled ? (
          <p className="mt-5 text-sm text-text-muted">
            The person who paid cancelled it and is getting their money back, so there is nothing to collect.
          </p>
        ) : (
          <>
            <p className="label mt-6 text-text-muted">Show this code at the pharmacy</p>
            <p className="mt-2 rounded-control bg-surface-muted py-5 text-center font-mono text-[40px] leading-none font-medium tracking-[0.25em]">
              {payment.pickupCode}
            </p>
            <p className="mt-4 text-sm text-text-muted">
              Nothing to pay. Bring the prescription if the medicine needs one, and don&rsquo;t share this code.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
