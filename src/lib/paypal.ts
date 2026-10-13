const BASE =
  process.env.PAYPAL_ENVIRONMENT === 'PRODUCTION' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

let cached: { token: string; expiresAt: number } | undefined;

async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token request failed: ${res.status}`);
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function paypal(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export type CreateOrderInput = {
  payeeEmail: string;
  amountUsd: string;
  description: string;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
};

export function createOrder(input: CreateOrderInput) {
  return paypal('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.referenceId,
          description: input.description,
          amount: { currency_code: 'USD', value: input.amountUsd },
          payee: { email_address: input.payeeEmail },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Homeward',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
}

export const getOrder = (id: string) => paypal(`/v2/checkout/orders/${encodeURIComponent(id)}`);

export const captureOrder = (id: string) =>
  paypal(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, { method: 'POST' });

export const getCapture = (id: string) => paypal(`/v2/payments/captures/${encodeURIComponent(id)}`);

// Asks PayPal whether a webhook delivery is genuine. Needs PAYPAL_WEBHOOK_ID, the id PayPal
// gives the webhook when its URL is registered; without it every delivery is rejected.
export async function verifyWebhook(headers: Headers, rawBody: string) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const fields = JSON.stringify({
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
  });
  // The event goes in exactly as received: re-serialising it can change the bytes PayPal signed.
  const res = await paypal('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: `${fields.slice(0, -1)},"webhook_event":${rawBody}}`,
  });
  return res.body.verification_status === 'SUCCESS';
}
