import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { AppHeader } from '@/components/brand';
import { formatTime, StatusChip } from '@/components/status-chip';
import { listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// The payer's orders and their pickup status. Single demo payer for now, so this lists every order.
export default async function Payments() {
  const rows = await listPayments();

  return (
    <>
      <AppHeader />
      <AutoRefresh />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 pt-12 pb-20">
        <p className="label text-text-muted">Orders &amp; pickups</p>
        <h1 className="text-[36px] leading-[1.05] font-semibold sm:text-[52px]">What you&rsquo;ve sent home.</h1>

        {rows.length === 0 && (
          <section className="card mt-4 p-8 text-center">
            <p className="text-text-muted">No orders yet. They appear here once you approve one.</p>
            <Link href="/app" className="btn mt-5">
              Order medicine
            </Link>
          </section>
        )}

        {rows.map(({ payment, plan }) => {
          const pickedUp = payment.status === 'collected';
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
                <Step
                  done={pickedUp}
                  text={pickedUp ? `${plan.beneficiary} picked it up` : `Waiting for ${plan.beneficiary} to pick it up`}
                  time={payment.collectedAt ? formatTime(payment.collectedAt) : 'Pending'}
                />
              </ol>
              <p className="label mt-5 border-t border-border pt-4 text-text-muted">PayPal order {payment.paypalOrderId}</p>
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
