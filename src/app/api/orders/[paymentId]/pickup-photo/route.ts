import { pickupPhoto } from '@/lib/pickup-check';

// The family member's own photo of what they collected, shown to the payer and on the receipt.
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const photo = await pickupPhoto(paymentId);
  if (!photo) return new Response('No photo', { status: 404 });
  return new Response(new Uint8Array(photo), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=60' },
  });
}
