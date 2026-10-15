import { headers } from 'next/headers';
import Link from 'next/link';
import { AppHeader } from '@/components/brand';
import { ShareLink } from '@/components/share-link';
import { settleOrder } from '@/lib/plans';
import { originOf } from '@/lib/respond';

export const dynamic = 'force-dynamic';

// PayPal sends the payer back here after approval; capture the order and show the result.
export default async function OrderReturn({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Failed detail="This page needs a PayPal order." />;

  const settled = await settleOrder(token);
  if (!settled) return <Failed detail="Nothing was charged. Go back and try again." />;
  const { order, captured, plan, payment } = settled;
  const origin = originOf(await headers());

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 pt-12 sm:pt-20">
        <p className="label flex items-center gap-2 text-accent">
          <span className="block size-1.5 rotate-45 bg-signal" />
          Paid
        </p>
        <h1 className="text-[36px] leading-[1.05] font-semibold sm:text-[52px]">
          {plan?.merchantName ?? 'The pharmacy'} has the order.
        </h1>
        <p className="text-text-muted">
          <span className="font-mono text-text">
            ${captured?.amount?.value} {captured?.amount?.currency_code}
          </span>{' '}
          for {plan?.beneficiary ?? 'your family'} · PayPal order <span className="font-mono">{order.id}</span>
        </p>

        {payment && plan && (
          <section className="card mt-4 p-6">
            <p className="label text-text-muted">Next step</p>
            <h2 className="mt-2 text-xl font-semibold">Send this link to {plan.beneficiary}</h2>
            <p className="mt-1 text-sm text-text-muted">
              It shows the pickup code to give {plan.merchantName}. You&rsquo;ll see it here the moment it&rsquo;s picked up.
            </p>
            <ShareLink
              url={`${origin}/b/${payment.beneficiaryToken}`}
              message={`Your medicine is paid for at ${plan.merchantName}. Open this for your pickup code:`}
            />
          </section>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/payments" className="btn btn-ghost">
            Track pickup
          </Link>
          {payment && (
            <Link href={`/receipt/${payment.id}`} className="btn btn-ghost">
              Receipt
            </Link>
          )}
          <Link href="/app" className="btn btn-ghost">
            New order
          </Link>
        </div>
      </main>
    </>
  );
}

function Failed({ detail }: { detail: string }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 pt-12 sm:pt-20">
        <p className="label text-danger">Not paid</p>
        <h1 className="text-[36px] leading-[1.05] font-semibold sm:text-[52px]">The payment didn&rsquo;t go through.</h1>
        <p className="text-text-muted">{detail}</p>
        <Link href="/app" className="btn mt-4 w-fit">
          Back to your order
        </Link>
      </main>
    </>
  );
}
