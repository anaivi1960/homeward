import { NextResponse } from 'next/server';
import { getCapture, verifyWebhook } from '@/lib/paypal';
import { markRefunded, settleOrder } from '@/lib/plans';

// PayPal calls this when an order changes, so a payment is recorded even if the payer
// never makes it back to /orders/return. A thrown error returns 500 and PayPal retries.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await verifyWebhook(request.headers, raw))) {
    return NextResponse.json({ error: 'Signature not verified' }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const resource = event.resource ?? {};

  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
      await settleOrder(resource.id);
      break;
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) await settleOrder(orderId);
      break;
    }
    case 'PAYMENT.CAPTURE.REFUNDED':
    case 'PAYMENT.CAPTURE.REVERSED': {
      // A refund names its capture in the "up" link; a reversal is the capture itself.
      const up = resource.links?.find((l: { rel: string }) => l.rel === 'up')?.href as string | undefined;
      const capture = await getCapture(up ? up.split('/').pop()! : resource.id);
      const orderId = capture.body.supplementary_data?.related_ids?.order_id;
      // A partial refund leaves the order collectable.
      if (orderId && capture.body.status !== 'PARTIALLY_REFUNDED') await markRefunded(orderId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
