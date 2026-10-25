import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/brand';
import { CheckSummary } from '@/components/pickup-check';
import { ReceiptActions } from '@/components/receipt-actions';
import { formatTime, StatusChip } from '@/components/status-chip';
import { getOrder } from '@/lib/paypal';
import { getPaymentById } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Receipt · Homeward', robots: { index: false } };

// A receipt for one order, to keep or send on. It never shows the pickup code.
export default async function Receipt({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const found = await getPaymentById(paymentId);
  if (!found) notFound();
  const { payment, plan, photoAt, check } = found;

  // The capture id is PayPal's own reference for the money moving; fine to leave out if PayPal is slow.
  const order = await getOrder(payment.paypalOrderId).catch(() => undefined);
  const capture = order?.body?.purchase_units?.[0]?.payments?.captures?.[0];

  const rows: [string, string][] = [
    ['Paid', formatTime(payment.paidAt)],
    ['Pharmacy', `${plan.merchantName}, ${plan.merchantCity}`],
    ['For', plan.beneficiary],
    ['Picked up', payment.collectedAt ? formatTime(payment.collectedAt) : payment.status === 'ready_for_pickup' ? 'Not yet' : 'No, cancelled'],
    ['PayPal order', payment.paypalOrderId],
    ...(capture?.id ? ([['PayPal transaction', capture.id]] as [string, string][]) : []),
    ['Homeward reference', payment.id.slice(0, 8).toUpperCase()],
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-[620px] flex-col gap-6 p-4 py-8 print:py-0">
      <div className="flex items-center justify-between gap-3">
        <Brand />
        <Link href="/payments" className="text-sm text-text-muted hover:text-text print:hidden">
          ← Orders &amp; pickups
        </Link>
      </div>

      <section className="card p-6 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label text-text-muted">Receipt</p>
            <h1 className="mt-2 text-[32px] leading-[1.05] font-semibold">${payment.amountUsd} USD</h1>
            <p className="mt-1 text-sm text-text-muted">Paid directly to {plan.merchantName} with PayPal</p>
          </div>
          <StatusChip status={payment.status} />
        </div>

        <ul className="mt-6 divide-y divide-border border-y border-border text-sm">
          {plan.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-4 py-2.5">
              <span>
                {item.name} <span className="text-text-muted">× {item.quantity}</span>
              </span>
              <span className="font-mono tabular-nums">${item.lineUsd}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 py-2.5 font-semibold">
            <span>Total</span>
            <span className="font-mono tabular-nums">${payment.amountUsd}</span>
          </li>
          {payment.status === 'refunded' && (
            <li className="flex justify-between gap-4 py-2.5 text-text-muted">
              <span>Refunded to your PayPal</span>
              <span className="font-mono tabular-nums">−${payment.amountUsd}</span>
            </li>
          )}
        </ul>

        <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>

        {photoAt && (
          <figure className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- served by our own route, already small */}
            <img
              src={`/api/orders/${payment.id}/photo`}
              alt={`The order as ${plan.merchantName} handed it over`}
              className="max-h-72 w-auto rounded-control border border-border"
            />
            <figcaption className="label mt-2 text-text-muted">Handover photo · {formatTime(photoAt)}</figcaption>
          </figure>
        )}

        {check && (
          <div className="mt-6">
            <p className="label mb-2 text-text-muted">Photo from {plan.beneficiary} · {formatTime(check.createdAt)}</p>
            <CheckSummary check={check} paymentId={payment.id} />
          </div>
        )}

        <p className="mt-6 text-xs text-text-muted">
          Sandbox demo receipt. Homeward never holds the money: PayPal pays the pharmacy directly.
        </p>
      </section>

      <ReceiptActions />
    </main>
  );
}
