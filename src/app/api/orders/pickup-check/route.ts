import { NextResponse } from 'next/server';
import { checkPickupPhoto } from '@/lib/pickup-check';

// The family member's pickup page posts a photo of what they collected.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const result = await checkPickupPhoto(String(body.token ?? ''), String(body.image ?? ''));
    return result ? NextResponse.json(result) : NextResponse.json({ error: 'not_checkable' }, { status: 400 });
  } catch (error) {
    console.warn('Pickup photo check failed:', error);
    return NextResponse.json({ error: 'check_failed' }, { status: 502 });
  }
}
