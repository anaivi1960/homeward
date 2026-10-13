import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { AppHeader } from '@/components/brand';
import { PageIntro } from '@/components/page-intro';
import { ReportForm, ReportStatus } from '@/components/problem-report';
import { formatTime, StatusChip } from '@/components/status-chip';
import { listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// The payer's orders and their pickup status. Single demo payer for now, so this lists every order.
export default async function Payments() {
  const rows = await listPayments();
  const waiting = rows.filter((r) => r.payment.status === 'ready_for_pickup').length;

  return (
    <>
      <AppHeader />
      <AutoRefresh />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 pt-8 pb-20 sm:pt-14">
        <PageIntro eyebrow="Orders & pickups" title="What you&rsquo;ve sent home." model="/models/tile-home.glb">
          {rows.length > 0 && (
            <p className="mt-3 text-text-muted">
              {rows.length} {rows.length === 1 ? 'order' : 'orders'} ·{' '}
              {waiting ? `${waiting} waiting for pickup` : 'nothing waiting'}
            </p>
          )}
        </PageIntro>

        {rows.length === 0 && (
          <section className="card mt-4 p-8 text-center">
            <p className="text-text-muted">No orders yet. They appear here once you approve one.</p>
            <Link href="/app" className="btn mt-5">
              Order medicine
            </Link>
          </section>
        )}

        {rows.map(({ payment, plan, report }) => {
          const pickedUp = Boolean(payment.collectedAt);
          const refundDue = payment.status === 'refund_due';
          const refunded = payment.status === 'refunded';
          return (
            <section key={payment.id} className="card mt-2 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold tracking-tight">{plan.items.map((i) => i.name).join(', ')}</p>
                  <p className="label mt-1 text-text-muted">
                    {plan.merchantName} · {plan.merchantCity} · for {plan.beneficiary}
                  </p>
                </div>
                <StatusChip status={payment.status} />
              </div>

              <ol className="mt-6 space-y-4">
                <Step done text={`You paid $${payment.amountUsd} USD`} time={formatTime(payment.paidAt)} />
                <Step done text={`Pickup code issued for ${plan.beneficiary}`} time={formatTime(payment.paidAt)} />
                {pickedUp ? (
                  <Step done text={`${plan.beneficiary} picked it up`} time={formatTime(payment.collectedAt!)} />
                ) : refundDue || refunded ? (
                  <Step done text="Cancelled. The pickup code no longer works." time="Before pickup" />
                ) : (
                  <Step done={false} text={`Waiting for ${plan.beneficiary} to pick it up`} time="Pending" />
                )}
                {refundDue && (
                  <Step
                    done={false}
                    text={`Waiting for ${plan.merchantName} to send your $${payment.amountUsd} refund`}
                    time="Pending"
                  />
                )}
                {refunded && <Step done text={`$${payment.amountUsd} USD refunded to your PayPal`} time="Confirmed by PayPal" />}
              </ol>

              {report && (
                <div className="mt-5">
                  <ReportStatus report={report} pharmacy={plan.merchantName} />
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="label text-text-muted">PayPal order {payment.paypalOrderId}</p>
                {payment.status === 'ready_for_pickup' && (
                  <Link href={`/b/${payment.beneficiaryToken}`} className="text-sm font-medium hover:text-accent">
                    {plan.beneficiary}&rsquo;s pickup link →
                  </Link>
                )}
              </div>

              {payment.status === 'ready_for_pickup' && (
                <details className="group mt-4">
                  <summary className="cursor-pointer list-none text-sm text-text-muted hover:text-danger">
                    Cancel this order <span className="group-open:hidden">→</span>
                  </summary>
                  <form action="/api/orders/cancel" method="post" className="mt-3 rounded-control bg-surface-muted p-4 text-sm">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <p>
                      The pickup code stops working straight away. {plan.merchantName} then refunds ${payment.amountUsd} USD
                      to your PayPal, and this page shows it once PayPal confirms.
                    </p>
                    <button type="submit" className="btn mt-4">
                      Cancel and ask for the refund
                    </button>
                  </form>
                </details>
              )}
              {payment.status === 'collected' && !report && (
                <div className="mt-4">
                  <ReportForm hidden={{ name: 'paymentId', value: payment.id }} summary="Something wrong with the medicine?" />
                </div>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}

function Step({ done, text, time }: { done: boolean; text: string; time: string }) {
  return (
    <li className="flex gap-4">
      <span
        className={`mt-1.5 block size-2 shrink-0 rotate-45 ${done ? 'bg-signal' : 'border border-text-muted bg-transparent'}`}
      />
      <div>
        <p className={done ? '' : 'text-text-muted'}>{text}</p>
        <p className="label mt-0.5 text-text-muted">{time}</p>
      </div>
    </li>
  );
}
