import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { Brand } from '@/components/brand';
import { HandoverPhoto } from '@/components/handover-photo';
import { PageIntro } from '@/components/page-intro';
import { answerBy } from '@/components/problem-report';
import { formatTime, StatusChip } from '@/components/status-chip';
import { Toast } from '@/components/toast';
import { problemReasons } from '@/db/schema';
import { getMerchant } from '@/lib/merchants';
import { listPayments } from '@/lib/plans';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listPayments>>[number];

// Demo portal: no pharmacy login yet, the pharmacy is chosen by URL.
export default async function MerchantPortal({
  params,
  searchParams,
}: {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{ wrong?: string; norefund?: string; confirmed?: string }>;
}) {
  const { merchantId } = await params;
  const { wrong, norefund, confirmed } = await searchParams;
  const merchant = getMerchant(merchantId);
  if (!merchant) notFound();
  const rows = await listPayments(merchant.id);
  const waiting = rows.filter((r) => r.payment.status === 'ready_for_pickup');
  const problems = rows.filter((r) => r.report?.status === 'open');
  const refunds = rows.filter((r) => r.payment.status === 'refund_due');
  const verified = rows.find((r) => r.payment.id === confirmed && r.payment.status === 'collected');
  const done = rows.filter((r) => !waiting.includes(r) && !problems.includes(r) && !refunds.includes(r));

  return (
    <main className="mx-auto flex min-h-dvh max-w-[720px] flex-col gap-4 p-4 py-8">
      {/* Refreshing would clear a half-typed code, so only poll when nothing is waiting on input. */}
      {waiting.length === 0 && <AutoRefresh />}
      {verified && (
        <Toast
          key={verified.payment.id}
          title="Code verified"
          detail={`Hand over the order for ${verified.plan.beneficiary}. It is now marked as picked up. You can add a handover photo under Earlier orders.`}
          clearParam="confirmed"
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Brand suffix="Pharmacy" />
        <Link href={`/merchant/${merchant.id}/ledger`} className="text-sm text-text-muted hover:text-text">
          Order ledger →
        </Link>
      </div>
      <div className="mt-6">
        <PageIntro eyebrow={`${merchant.city} · Pharmacy counter`} title={merchant.name} model="/models/tile-counter.glb">
          <p className="mt-3 text-text-muted">
            {waiting.length
              ? `${waiting.length} paid ${waiting.length === 1 ? 'order' : 'orders'} waiting for pickup. Ask for the code before you hand anything over.`
              : 'Nothing waiting for pickup. Paid orders appear here as soon as a family pays.'}
          </p>
        </PageIntro>
      </div>

      {problems.length > 0 && <h2 className="label mt-6 text-danger">Problems reported</h2>}
      {problems.map((row) => {
        const report = row.report!;
        const overdue = answerBy(report) < new Date();
        return (
          <section key={row.payment.id} className="card border-danger! p-5">
            <OrderSummary row={row} />
            <div className="mt-5 rounded-control bg-surface-muted p-4 text-sm">
              <p className="label text-text-muted">
                {problemReasons[report.reason]} · reported by the {report.reportedBy === 'payer' ? 'payer' : 'customer'}
              </p>
              {report.details && <p className="mt-2 whitespace-pre-wrap">{report.details}</p>}
              <p className={`mt-2 ${overdue ? 'text-danger' : 'text-text-muted'}`}>
                {overdue ? 'Overdue. Answer now.' : `Answer by ${formatTime(answerBy(report))}.`}
              </p>
            </div>
            <form action={`/merchant/${merchant.id}/resolve`} method="post" className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="reportId" value={report.id} />
              <button type="submit" name="answer" value="replaced" className="btn">
                We&rsquo;ll replace it
              </button>
              <button type="submit" name="answer" value="refund" className="btn btn-ghost">
                We&rsquo;ll refund it
              </button>
            </form>
          </section>
        );
      })}

      {refunds.length > 0 && <h2 className="label mt-6 text-warning">Refunds to send</h2>}
      {refunds.map((row) => (
        <section key={row.payment.id} className="card p-5">
          <OrderSummary row={row} />
          <p className="mt-5 text-sm">
            {row.payment.collectedAt
              ? 'You agreed to refund this order.'
              : 'The payer cancelled before pickup. Do not hand this order over.'}{' '}
            Refund <span className="font-mono">${row.payment.amountUsd} USD</span> from your PayPal account (PayPal order{' '}
            <span className="font-mono">{row.payment.paypalOrderId}</span>), then confirm here.
          </p>
          <form action={`/merchant/${merchant.id}/refund-check`} method="post" className="mt-4">
            <input type="hidden" name="paymentId" value={row.payment.id} />
            <button type="submit" className="btn">
              I&rsquo;ve refunded it
            </button>
          </form>
          {norefund === row.payment.id && (
            <p className="mt-3 text-sm text-danger">PayPal doesn&rsquo;t show a full refund for this payment yet.</p>
          )}
        </section>
      ))}

      {waiting.length > 0 && <h2 className="label mt-6 text-text-muted">Waiting for pickup</h2>}
      {waiting.map((row) => (
        <section key={row.payment.id} className="card p-5">
          <OrderSummary row={row} />
          <form
            action={`/merchant/${merchant.id}/confirm`}
            method="post"
            className={`mt-5 rounded-control border-2 bg-surface-muted p-4 ${wrong === row.payment.id ? 'border-danger' : 'border-text'}`}
          >
            <input type="hidden" name="paymentId" value={row.payment.id} />
            <label htmlFor={`code-${row.payment.id}`} className="block text-lg font-semibold tracking-tight">
              Enter the customer&rsquo;s 6-letter pickup code
            </label>
            <p className="mt-1 text-sm text-text-muted">Ask {row.plan.beneficiary} to read it out or show it on their phone.</p>
            <div className="mt-4 flex flex-wrap items-stretch gap-3">
              <input
                id={`code-${row.payment.id}`}
                name="code"
                required
                minLength={6}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus={row === waiting[0]}
                placeholder="······"
                className="h-16 w-full max-w-[280px] rounded-control border-2 border-border bg-surface text-center font-mono text-[32px] font-medium tracking-[0.3em] uppercase outline-none placeholder:text-border focus:border-signal"
              />
              <button type="submit" className="btn h-16 px-7 text-lg">
                Verify code
              </button>
            </div>
            {wrong === row.payment.id && (
              <p role="alert" className="mt-3 text-sm font-medium text-danger">
                That code doesn&rsquo;t match this order. Check it and try again.
              </p>
            )}
          </form>
        </section>
      ))}

      {done.length > 0 && <h2 className="label mt-6 text-text-muted">Earlier orders</h2>}
      {done.map((row) => (
        <section key={row.payment.id} className="card p-5">
          <OrderSummary row={row} />
          <p className="label mt-4 text-text-muted">
            {row.payment.collectedAt ? `Picked up ${formatTime(row.payment.collectedAt)}` : 'Cancelled before pickup'}
            {row.payment.status === 'refunded' && ' · Refunded to the payer'}
            {row.report?.status === 'replaced' && ' · Problem reported, replaced'}
          </p>
          {row.payment.status === 'collected' && (
            <HandoverPhoto merchantId={merchant.id} paymentId={row.payment.id} hasPhoto={Boolean(row.photoAt)} />
          )}
        </section>
      ))}
    </main>
  );
}

function OrderSummary({ row: { payment, plan } }: { row: Row }) {
  return (
    <>
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
        <li className="flex justify-between gap-4 py-2.5 font-semibold">
          <span>Paid to you</span>
          <span className="font-mono tabular-nums">${payment.amountUsd}</span>
        </li>
      </ul>
    </>
  );
}
