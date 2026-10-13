import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { Brand } from '@/components/brand';
import { formatTime, StatusChip } from '@/components/status-chip';
import { getMerchant } from '@/lib/merchants';
import { listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// Demo portal: no pharmacy login yet, the pharmacy is chosen by URL.
export default async function MerchantPortal({
  params,
  searchParams,
}: {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{ wrong?: string }>;
}) {
  const { merchantId } = await params;
  const { wrong } = await searchParams;
  const merchant = getMerchant(merchantId);
  if (!merchant) notFound();
  const rows = await listPayments(merchant.id);
  const waiting = rows.filter((r) => r.payment.status === 'ready_for_pickup').length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[720px] flex-col gap-4 p-4 py-8">
      {/* Refreshing would clear a half-typed code, so only poll when nothing is waiting on input. */}
      {waiting === 0 && <AutoRefresh />}
      <Brand suffix="Pharmacy" />
      <p className="label mt-8 text-text-muted">
        {merchant.city} · {waiting} waiting for pickup
      </p>
      <h1 className="text-[36px] leading-[1.05] font-semibold sm:text-[52px]">{merchant.name}</h1>

      {rows.length === 0 && (
        <p className="card mt-4 p-8 text-center text-text-muted">
          No paid orders yet. They appear here as soon as a family pays.
        </p>
      )}

      {rows.map(({ payment, plan }) => (
        <section key={payment.id} className="card mt-2 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold tracking-tight">For {plan.beneficiary}</p>
              <p className="label mt-1 text-text-muted">Paid {formatTime(payment.paidAt)}</p>
            </div>
            <StatusChip status={payment.status} />
          </div>
          <ul className="mt-5 divide-y divide-border border-y border-border text-sm">
            {plan.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-4 py-2.5">
                <span>
                  {item.name} <span className="text-text-muted">× {item.quantity}</span>
                </span>
                <span className="font-mono tabular-nums">${item.lineUsd}</span>
              </li>
            ))}
          </ul>
          <p className="amount mt-4 text-2xl font-semibold">${payment.amountUsd}</p>

          {payment.status === 'ready_for_pickup' ? (
            <form action={`/merchant/${merchant.id}/confirm`} method="post" className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="paymentId" value={payment.id} />
              <input
                name="code"
                required
                maxLength={6}
                autoComplete="off"
                placeholder="CODE"
                aria-label="Pickup code"
                className="min-h-11 w-40 rounded-full border border-border bg-surface px-5 font-mono tracking-[0.25em] uppercase outline-none focus:border-text"
              />
              <button type="submit" className="btn">
                Confirm pickup
              </button>
            </form>
          ) : (
            <p className="label mt-3 text-text-muted">
              Picked up {payment.collectedAt && formatTime(payment.collectedAt)}
            </p>
          )}
          {wrong === payment.id && (
            <p className="mt-3 text-sm text-danger">That code doesn&rsquo;t match this order. Check it and try again.</p>
          )}
        </section>
      ))}
    </main>
  );
}
