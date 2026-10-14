import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { handoverPhotos, payments } from '@/db/schema';
import { UUID } from './plans';

// The pharmacy's photo of an order at handover. The browser shrinks it to a small JPEG first,
// so it is kept in the database rather than in separate file storage.
const MAX_CHARS = 600_000;

export async function saveHandoverPhoto(merchantId: string, paymentId: string, image: string) {
  if (!UUID.test(paymentId) || !image.startsWith('data:image/jpeg;base64,') || image.length > MAX_CHARS) return false;
  const [payment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.merchantId, merchantId), eq(payments.status, 'collected')));
  if (!payment) return false;
  await db
    .insert(handoverPhotos)
    .values({ paymentId, image })
    .onConflictDoUpdate({ target: handoverPhotos.paymentId, set: { image, createdAt: new Date() } });
  return true;
}

export async function handoverPhoto(paymentId: string) {
  if (!UUID.test(paymentId)) return undefined;
  const [row] = await db.select().from(handoverPhotos).where(eq(handoverPhotos.paymentId, paymentId));
  if (!row) return undefined;
  return Buffer.from(row.image.slice('data:image/jpeg;base64,'.length), 'base64');
}
