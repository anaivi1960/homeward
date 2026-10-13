import { requestCancel } from '@/lib/plans';
import { respond } from '@/lib/respond';

// The payer's "Cancel order" form posts here. Only works before pickup.
export async function POST(request: Request) {
  const form = await request.formData();
  const ok = await requestCancel(String(form.get('paymentId')));
  return respond(request, '/payments', ok);
}
