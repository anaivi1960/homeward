// Sends order events to a Zapier "Catch Hook" so a Zap can text the family member, email the
// payer or alert the pharmacy. Does nothing unless ZAPIER_HOOK_URL is set, and never fails the
// request it is called from.
export type OrderEvent =
  | 'order.paid'
  | 'order.picked_up'
  | 'order.cancel_requested'
  | 'order.refunded'
  | 'problem.reported'
  | 'problem.answered';

// Render sets RENDER_EXTERNAL_URL on every web service.
export const appUrl = () => process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000';

export async function notify(event: OrderEvent, data: Record<string, unknown>) {
  const url = process.env.ZAPIER_HOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, sentAt: new Date().toISOString(), ...data }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    console.warn(`Zapier hook failed for ${event}:`, error);
  }
}
