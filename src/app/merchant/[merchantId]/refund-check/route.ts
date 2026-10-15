import { checkRefund } from '@/lib/plans';
import { respond } from '@/lib/respond';

// "I've refunded it" posts here; the order only closes if PayPal shows the refund.
export async function POST(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const form = await request.formData();
  const paymentId = String(form.get('paymentId'));
  const refunded = await checkRefund(merchantId, paymentId);

  return respond(request, `/merchant/${merchantId}${refunded ? '' : `?norefund=${encodeURIComponent(paymentId)}`}`, refunded);
}
