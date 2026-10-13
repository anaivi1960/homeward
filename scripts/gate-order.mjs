// Week-1 gate: can a sandbox order name a demo merchant as payee?
// Run: node --env-file=.env scripts/gate-order.mjs
const base = 'https://api-m.sandbox.paypal.com';
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX_MERCHANT_EMAILS } = process.env;
const merchant = PAYPAL_SANDBOX_MERCHANT_EMAILS.split(',')[0];

const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
});
const { access_token } = await tokenRes.json();

const orderRes = await fetch(`${base}/v2/checkout/orders`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: 'Gate test: blood-pressure medicine',
        amount: { currency_code: 'USD', value: '18.40' },
        payee: { email_address: merchant },
      },
    ],
  }),
});
const order = await orderRes.json();
console.log('status', orderRes.status, order.status ?? order.name);
console.log('order id', order.id);
console.log('payee', order.purchase_units?.[0]?.payee);
console.log('approve', order.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href);
if (!orderRes.ok) console.log(JSON.stringify(order, null, 2));
