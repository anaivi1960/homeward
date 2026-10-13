import { confirmPickup } from '@/lib/plans';
import { respond } from '@/lib/respond';

// The merchant portal's "Confirm pickup" form and the ledger grid's code column post here.
export async function POST(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const form = await request.formData();
  const paymentId = String(form.get('paymentId'));
  const ok = await confirmPickup(merchantId, paymentId, String(form.get('code') ?? ''));

  const portal = new URL(`/merchant/${merchantId}`, request.url);
  if (!ok) portal.searchParams.set('wrong', paymentId);
  return respond(request, portal, ok);
}
