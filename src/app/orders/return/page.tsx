import Link from 'next/link';
import { captureOrder, getOrder } from '@/lib/paypal';
import { getPlan, recordPayment } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// PayPal sends the payer back here after approval; capture the order and show the result.
export default async function OrderReturn({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Failed detail="This page needs a PayPal order." />;

  const capture = await captureOrder(token);
  // A refresh re-posts the capture; fall back to the stored order instead of failing.
  const order = capture.ok ? capture.body : (await getOrder(token)).body;
  if (order.status !== 'COMPLETED') return <Failed detail="Nothing was charged. Go back and try again." />;

  const unit = order.purchase_units?.[0];
  const captured = unit?.payments?.captures?.[0];
  const plan = await getPlan(unit?.reference_id);
  const payment = plan && (await recordPayment(plan, order.id, captured?.amount?.value ?? plan.amountUsd));

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col justify-center gap-6 p-4">
      <section className="rounded-card border border-border bg-surface p-6">
        <p className="text-sm font-medium text-success">✓ Paid</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Paid. {plan?.merchantName ?? 'The merchant'} has the order.
        </h1>
        <p className="mt-2 text-text-muted">
          ${captured?.amount?.value} {captured?.amount?.currency_code} for {plan?.beneficiary ?? 'your family'}
        </p>
        <p className="mt-4 font-mono text-sm text-text-muted">PayPal order {order.id}</p>
      </section>

      {payment && plan && (
        <section className="rounded-card border border-border bg-surface p-6">
          <h2 className="font-semibold">Send this link to {plan.beneficiary}</h2>
          <p className="mt-1 text-sm text-text-muted">
            It shows the pickup code to give {plan.merchantName} when collecting.
          </p>
          <Link
            href={`/b/${payment.beneficiaryToken}`}
            className="mt-3 block break-all font-mono text-sm text-primary underline underline-offset-4"
          >
            /b/{payment.beneficiaryToken}
          </Link>
        </section>
      )}

      <div className="flex gap-6">
        <Link href="/payments" className="text-primary underline underline-offset-4">
          See all payments
        </Link>
        <Link href="/" className="text-primary underline underline-offset-4">
          Back to Homeward
        </Link>
      </div>
    </main>
  );
}

function Failed({ detail }: { detail: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col justify-center gap-6 p-4">
      <section className="rounded-card border border-border bg-surface p-6">
        <p className="text-sm font-medium text-danger">✕ Failed</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">The payment didn&rsquo;t go through</h1>
        <p className="mt-2 text-text-muted">{detail}</p>
      </section>
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to Homeward
      </Link>
    </main>
  );
}
