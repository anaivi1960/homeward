// Posts order events as JSON to any URL you choose, so something else can text the family
// member, email the payer or alert the pharmacy: a self-hosted n8n or Activepieces workflow, or
// your own endpoint. Does nothing unless NOTIFY_WEBHOOK_URL is set, and never fails the request
// it is called from.
export type OrderEvent =
  | 'order.paid'
  | 'order.picked_up'
  | 'order.cancel_requested'
  | 'order.refunded'
  | 'problem.reported'
  | 'problem.answered';

// Render sets RENDER_EXTERNAL_URL on every web service.
export const appUrl = () =>
  (process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function notify(event: OrderEvent, data: Record<string, unknown>) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, sentAt: new Date().toISOString(), ...data }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    console.warn(`Notification webhook failed for ${event}:`, error);
  }
}
