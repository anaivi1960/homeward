import Link from 'next/link';
import { AllowanceMeter } from '@/components/allowance-meter';
import { AutoRefresh } from '@/components/auto-refresh';
import { AppHeader } from '@/components/brand';
import { OrderScene } from '@/components/order-scene';
import { PageIntro } from '@/components/page-intro';
import { CheckSummary } from '@/components/pickup-check';
import { ReportForm, ReportStatus } from '@/components/problem-report';
import { formatTime, StatusChip } from '@/components/status-chip';
import { listAllowances } from '@/lib/allowances';
import { orderStage } from '@/lib/order-stage';
import { listPayments } from '@/lib/plans';
import { draftDueRefills, listRefills, refilledPlanIds } from '@/lib/refills';

export const dynamic = 'force-dynamic';

const day = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// The payer's orders and their pickup status. Single demo payer for now, so this lists every order.
export default async function Payments() {
  // There is no scheduler: due refills are drafted whenever the payer looks at their orders.
  await draftDueRefills();
  const [rows, refills, allowances, refilled] = await Promise.all([
    listPayments(),
    listRefills(),
    listAllowances(),
    refilledPlanIds(),
  ]);
  const waiting = rows.filter((r) => r.payment.status === 'ready_for_pickup').length;
  // One live diorama, for the latest order still in progress or just picked up.
  const featured = rows.find((r) => orderStage(r.payment, r.plan));

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

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <section className="card p-5">
            <h2 className="label text-text-muted">Monthly refills</h2>
            {refills.length === 0 && (
              <p className="mt-3 text-sm text-text-muted">
                For medicine taken every month, choose &ldquo;Repeat monthly&rdquo; on an order. Homeward drafts the next
                order when it is due and you approve it, as always.
              </p>
            )}
            <ul className="mt-3 space-y-4">
              {refills.map((refill) => (
                <li key={refill.id} className="text-sm">
                  <p className="font-medium">
                    {refill.items.map((i) => i.name).join(', ')} for {refill.beneficiary}
                  </p>
                  <p className="label mt-1 text-text-muted">
                    {refill.merchantName} · every {refill.everyDays} days · next {day(refill.nextDue)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {refill.waiting ? (
                      <form action="/api/orders" method="post">
                        <input type="hidden" name="planId" value={refill.waiting.planId} />
                        <button type="submit" className="btn min-h-10! px-4! text-sm">
                          Approve ${refill.waiting.amountUsd} with PayPal
                        </button>
                      </form>
                    ) : (
                      <form action="/api/refills" method="post">
                        <input type="hidden" name="action" value="now" />
                        <input type="hidden" name="refillId" value={refill.id} />
                        <button type="submit" className="btn btn-ghost min-h-10! px-4! text-sm">
                          Prepare the next order now
                        </button>
                      </form>
                    )}
                    <form action="/api/refills" method="post">
                      <input type="hidden" name="action" value="stop" />
                      <input type="hidden" name="refillId" value={refill.id} />
                      <button type="submit" className="text-sm text-text-muted hover:text-danger">
                        Stop
                      </button>
                    </form>
                  </div>
                  {refill.waiting && <p className="mt-2 text-xs text-accent">Next order ready at today&rsquo;s prices.</p>}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="label text-text-muted">Monthly allowances</h2>
            {allowances.length === 0 && (
              <p className="mt-3 text-sm text-text-muted">
                Set a monthly amount for a family member. Orders over it ask you to confirm before you pay.
              </p>
            )}
            <ul className="mt-3 space-y-4">
              {allowances.map((allowance) => (
                <li key={allowance.beneficiary} className="text-sm">
                  <AllowanceMeter allowance={allowance} />
                  <form action="/api/allowances" method="post" className="mt-1 text-right">
                    <input type="hidden" name="action" value="remove" />
                    <input type="hidden" name="beneficiary" value={allowance.beneficiary} />
                    <button type="submit" className="text-xs text-text-muted hover:text-danger">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action="/api/allowances" method="post" className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
              <label className="flex flex-1 flex-col gap-1 text-xs text-text-muted">
                For
                <input
                  name="beneficiary"
                  required
                  maxLength={60}
                  placeholder="Mum"
                  className="min-h-10 min-w-24 rounded-full border border-border bg-surface px-4 text-sm text-text outline-none focus:border-text"
                />
              </label>
              <label className="flex w-28 flex-col gap-1 text-xs text-text-muted">
                USD a month
                <input
                  name="monthlyUsd"
                  type="number"
                  required
                  min={1}
                  max={10000}
                  step="0.01"
                  placeholder="50"
                  className="min-h-10 rounded-full border border-border bg-surface px-4 text-sm text-text outline-none focus:border-text"
                />
              </label>
              <button type="submit" className="btn min-h-10! px-4! text-sm">
                Set
              </button>
            </form>
          </section>
        </div>

        {rows.length === 0 && (
          <section className="card mt-4 p-8 text-center">
            <p className="text-text-muted">No orders yet. They appear here once you approve one.</p>
            <Link href="/app" className="btn mt-5">
              Order medicine
            </Link>
          </section>
        )}

        {rows.map(({ payment, plan, report, photoAt, check }) => {
          const pickedUp = Boolean(payment.collectedAt);
          const refundDue = payment.status === 'refund_due';
          const refunded = payment.status === 'refunded';
          const scene = featured?.payment.id === payment.id ? orderStage(payment, plan) : undefined;
          return (
            <section key={payment.id} className="card mt-2 p-5">
              {scene && (
                <div className="mb-5">
                  <OrderScene {...scene} />
                </div>
              )}
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
                  <Step
                    done
                    text={`${plan.beneficiary} picked it up${check?.confirmedPickup ? ', confirmed by their photo' : ''}`}
                    time={formatTime(payment.collectedAt!)}
                  >
                    {check && (
                      <div className="mt-2">
                        <CheckSummary check={check} paymentId={payment.id} />
                      </div>
                    )}
                    {photoAt && (
                      <a href={`/api/orders/${payment.id}/photo`} target="_blank" rel="noreferrer" className="mt-2 block w-fit">
                        {/* eslint-disable-next-line @next/next/no-img-element -- served by our own route, already small */}
                        <img
                          src={`/api/orders/${payment.id}/photo`}
                          alt={`The order as ${plan.merchantName} handed it over`}
                          className="h-28 w-auto rounded-control border border-border"
                        />
                        <span className="label mt-1 block text-text-muted">Handover photo from {plan.merchantName}</span>
                      </a>
                    )}
                  </Step>
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
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                  {(payment.status === 'ready_for_pickup' || payment.status === 'collected') &&
                    (refilled.has(plan.id) ? (
                      <span className="label text-accent">Repeats monthly</span>
                    ) : (
                      <form action="/api/refills" method="post">
                        <input type="hidden" name="action" value="start" />
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <button type="submit" className="hover:text-accent">
                          Repeat monthly
                        </button>
                      </form>
                    ))}
                  <Link href={`/receipt/${payment.id}`} className="hover:text-accent">
                    Receipt →
                  </Link>
                  {payment.status === 'ready_for_pickup' && (
                    <Link href={`/b/${payment.beneficiaryToken}`} className="hover:text-accent">
                      {plan.beneficiary}&rsquo;s pickup link →
                    </Link>
                  )}
                </div>
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

function Step({ done, text, time, children }: { done: boolean; text: string; time: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        className={`mt-1.5 block size-2 shrink-0 rotate-45 ${done ? 'bg-signal' : 'border border-text-muted bg-transparent'}`}
      />
      <div>
        <p className={done ? '' : 'text-text-muted'}>{text}</p>
        <p className="label mt-0.5 text-text-muted">{time}</p>
        {children}
      </div>
    </li>
  );
}
