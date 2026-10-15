import { draftDueRefills, startRefill, stopRefill } from '@/lib/refills';
import { respond } from '@/lib/respond';

// Monthly refill buttons on Orders & pickups: start one from a paid order, prepare the next
// order early, or stop it.
export async function POST(request: Request) {
  const form = await request.formData();
  const action = String(form.get('action'));
  let ok = false;
  if (action === 'start') ok = await startRefill(String(form.get('paymentId')));
  if (action === 'stop') ok = await stopRefill(String(form.get('refillId')));
  if (action === 'now') {
    await draftDueRefills(String(form.get('refillId')));
    ok = true;
  }
  return respond(request, '/payments', ok);
}
