import { NextResponse } from 'next/server';
import { getMerchant } from '@/lib/merchants';
import { createOrder } from '@/lib/paypal';
import { getPlan } from '@/lib/plans';

// Creates a PayPal order for a care plan and sends the payer to PayPal to approve it.
export async function POST(request: Request) {
  const form = await request.formData();
  const plan = await getPlan(String(form.get('planId')));
  const merchant = plan && getMerchant(plan.merchantId);
  if (!plan || !merchant) return NextResponse.json({ error: 'Unknown care plan' }, { status: 404 });
  if (plan.status === 'paid') return NextResponse.json({ error: 'This plan is already paid' }, { status: 409 });

  const origin = new URL(request.url).origin;
  const order = await createOrder({
    payeeEmail: merchant.payeeEmail,
    amountUsd: plan.amountUsd,
    description: plan.items.map((i) => i.name).join(', ').slice(0, 127),
    referenceId: plan.id,
    returnUrl: `${origin}/orders/return`,
    cancelUrl: `${origin}/?cancelled=1`,
  });

  const approve = order.body.links?.find((l: { rel: string }) => l.rel === 'payer-action' || l.rel === 'approve');
  if (!order.ok || !approve) {
    return NextResponse.json({ error: 'PayPal did not create the order', detail: order.body }, { status: 502 });
  }
  return NextResponse.redirect(approve.href, 303);
}
