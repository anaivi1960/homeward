import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { formatTime, StatusChip } from '@/components/status-chip';
import { getMerchant } from '@/lib/merchants';
import { confirmPickup, listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// Demo portal: no merchant login yet, the merchant is chosen by URL.
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

  async function confirm(formData: FormData) {
    'use server';
    const paymentId = String(formData.get('paymentId'));
    const ok = await confirmPickup(merchantId, paymentId, String(formData.get('code') ?? ''));
    revalidatePath(`/merchant/${merchantId}`);
    redirect(ok ? `/merchant/${merchantId}` : `/merchant/${merchantId}?wrong=${paymentId}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-6 p-4 py-12">
      <header>
        <p className="font-display text-xl font-semibold text-primary">Homeward for merchants</p>
        <h1 className="mt-6 font-display text-[32px] leading-[38px] font-semibold">{merchant.name}</h1>
        <p className="text-text-muted">{merchant.city} · Paid orders</p>
      </header>

      {rows.length === 0 && (
        <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
          No paid orders yet. They appear here as soon as a family pays.
        </p>
      )}

      {rows.map(({ payment, plan }) => (
        <section key={payment.id} className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                For <span className="text-accent">{plan.beneficiary}</span>
              </p>
              <p className="text-sm text-text-muted">Paid {formatTime(payment.paidAt)}</p>
            </div>
            <StatusChip status={payment.status} />
          </div>
          <ul className="mt-3 border-t border-border pt-3 text-sm">
            {plan.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-4">
                <span>
                  {item.name} <span className="text-text-muted">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">${item.lineUsd}</span>
              </li>
            ))}
          </ul>
          <p className="amount mt-3 text-2xl font-semibold">${payment.amountUsd}</p>

          {payment.status === 'ready_for_pickup' ? (
            <form action={confirm} className="mt-4 flex gap-2">
              <input type="hidden" name="paymentId" value={payment.id} />
              <input
                name="code"
                required
                maxLength={6}
                autoComplete="off"
                placeholder="Pickup code"
                aria-label="Pickup code"
                className="min-h-11 w-40 rounded-control border border-border bg-bg px-3 font-mono tracking-widest uppercase outline-primary"
              />
              <button type="submit" className="min-h-11 rounded-control bg-primary px-4 font-semibold text-on-primary">
                Confirm handover
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Handed over {payment.collectedAt && formatTime(payment.collectedAt)}.
            </p>
          )}
          {wrong === payment.id && (
            <p className="mt-2 text-sm text-danger">That code doesn&rsquo;t match this order. Check it and try again.</p>
          )}
        </section>
      ))}
    </main>
  );
}
