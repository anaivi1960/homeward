import { NextResponse } from 'next/server';
import { saveHandoverPhoto } from '@/lib/handover';

// The pharmacy counter uploads a photo of an order it has handed over.
export async function POST(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const body = await request.json().catch(() => ({}));
  const ok = await saveHandoverPhoto(merchantId, String(body.paymentId ?? ''), String(body.image ?? ''));
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
