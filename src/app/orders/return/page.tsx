import Link from 'next/link';
import { captureOrder, getOrder } from '@/lib/paypal';
import { getPlan, markPaid } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// PayPal sends the payer back here after approval; capture the order and show the result.
export default async function OrderReturn({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Result title="No payment to show" tone="danger" detail="This page needs a PayPal order." />;

  const capture = await captureOrder(token);
  // A refresh re-posts the capture; fall back to the stored order instead of failing.
  const order = capture.ok ? capture.body : (await getOrder(token)).body;

  if (order.status !== 'COMPLETED') {
    return (
      <Result
        title="The payment didn't go through"
        tone="danger"
        detail="Nothing was charged. Go back and try again."
      />
    );
  }

  const unit = order.purchase_units?.[0];
  const captured = unit?.payments?.captures?.[0];
  const plan = getPlan(unit?.reference_id);
  if (plan) markPaid(plan.id, order.id);

  return (
    <Result
      title={`Paid. ${plan?.merchantName ?? 'The merchant'} has the order.`}
      tone="success"
      detail={`$${captured?.amount?.value} ${captured?.amount?.currency_code} for ${plan?.beneficiary ?? 'your family'}`}
      reference={order.id}
    />
  );
}

function Result(props: { title: string; detail: string; tone: 'success' | 'danger'; reference?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col justify-center gap-6 p-4">
      <section className="rounded-card border border-border bg-surface p-6">
        <p className={`text-sm font-medium ${props.tone === 'success' ? 'text-success' : 'text-danger'}`}>
          {props.tone === 'success' ? '✓ Paid' : '✕ Failed'}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{props.title}</h1>
        <p className="mt-2 text-text-muted">{props.detail}</p>
        {props.reference && (
          <p className="mt-4 font-mono text-sm text-text-muted">PayPal order {props.reference}</p>
        )}
      </section>
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to Homeward
      </Link>
    </main>
  );
}
