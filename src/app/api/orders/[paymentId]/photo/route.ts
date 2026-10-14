import { handoverPhoto } from '@/lib/handover';

// The pharmacy's handover photo for an order, shown to the payer and on the receipt.
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const photo = await handoverPhoto(paymentId);
  if (!photo) return new Response('No photo', { status: 404 });
  return new Response(new Uint8Array(photo), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=300' },
  });
}
