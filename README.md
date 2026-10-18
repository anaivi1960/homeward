# Homeward

Pay for what family at home needs, and see proof it arrived.

Homeward lets someone abroad order medicine for family in Nigeria by telling an AI agent what is needed. The agent finds a verified pharmacy, the payer approves the payment with PayPal, and the money goes to the pharmacy, not to an individual. The family member collects with a pickup code, and the payer sees the moment it is picked up.

Built for the PayPal AI Hackathon 2026. It runs entirely in the PayPal sandbox; no real money moves.

## Status

Work in progress.

Live (PayPal sandbox): https://homeward-auzn.onrender.com. The free Render plan sleeps when idle, so the first request can take up to a minute.

- Working: landing page with 3D scenes, chat with the agent (including reading a photo of a prescription back for confirmation), pharmacy search, order drafting, PayPal order paid directly to a pharmacy's sandbox account, Postgres storage, pickup codes, family pickup page (`/b/<token>`), pharmacy counter (`/merchant/ndidi-pharmacy`) and order ledger (`/merchant/ndidi-pharmacy/ledger`), orders and pickups (`/payments`) with a live order scene, monthly refills and monthly allowances per family member, a handover photo taken by the pharmacy at pickup, receipts (`/receipt/<paymentId>`), partner pharmacy map and directory (`/pharmacies`), cancelling before pickup, and reporting a problem after pickup.
- The PayPal webhook (`/api/webhooks/paypal`) is registered for the deployed site and has handled real sandbox deliveries.
- Refunds are sent by the pharmacy from its own PayPal account. PayPal does not let Homeward refund a payment made to a pharmacy, so Homeward switches the pickup code off, asks the pharmacy to refund, and checks with PayPal that it happened.
- Refills are drafted when the orders page loads; there is no background scheduler yet.
- WellaHealth partner pharmacies are shown in the directory but cannot take orders yet; ordering uses three sandbox-backed demo pharmacies.
- Not built yet: pharmacy login, photos on problem reports, escalation after the 48-hour problem window, delivery tracking.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- 3D scenes modelled and animated in Blender (`assets/homeward-scene.blend`), shown with three.js
- Claude through the Vercel AI SDK
- PayPal Orders and Payments APIs, PayPal webhooks, and the [PayPal Agent Toolkit](https://github.com/paypal/agent-toolkit)
- [AG Grid](https://www.ag-grid.com/) for the pharmacy order ledger and the partner directory
- [Render](https://render.com/) for hosting (`render.yaml`)
- Optional: an outgoing webhook for notifications (works with open-source tools such as [n8n](https://n8n.io/)), [Elasticsearch](https://www.elastic.co/) for partner-pharmacy search
- A [Postman](https://www.postman.com/) collection of every API call (`postman/`)

## Run it locally

Requires Node 20 or later.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill it in, including a Postgres `DATABASE_URL`, then run `node --env-file=.env scripts/migrate.mjs` to create the tables. You need a PayPal sandbox REST app, one personal sandbox account (the payer), four business sandbox accounts (Homeward plus three pharmacies), and a Claude API key.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000, open the app, ask for something (for example "Order Mum's blood-pressure medicine in Enugu"), and approve the plan with the personal sandbox account.

`node --env-file=.env scripts/gate-order.mjs` checks that your sandbox app can create an order naming a merchant as payee.

## Deploy to Render

1. Push this repository to GitHub.
2. In Render choose **New > Blueprint** and pick the repository. `render.yaml` describes the service.
3. Fill in the environment variables Render asks for (the same values as your `.env`).
4. After the first deploy, register `https://<your-service>.onrender.com/api/webhooks/paypal` as a webhook in the PayPal developer dashboard for the events `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED` and `PAYMENT.CAPTURE.REVERSED`, then set `PAYPAL_WEBHOOK_ID` in Render to the id PayPal gives it.

## Optional integrations

**Notifications.** Set `NOTIFY_WEBHOOK_URL` to any URL that accepts a JSON POST, for example a Webhook trigger in a self-hosted [n8n](https://n8n.io/) or [Activepieces](https://www.activepieces.com/) workflow. Homeward posts a JSON event to it when an order is paid (`order.paid`), picked up (`order.picked_up`), cancelled (`order.cancel_requested`) or refunded (`order.refunded`), and when a problem is reported (`problem.reported`) or answered (`problem.answered`). Each event carries the pharmacy, the items, the amount, and `pickupUrl`, the link to text to the family member.

**Elasticsearch.** Set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY`, then load the WellaHealth partner directory:

```bash
node --env-file=.env scripts/index-pharmacies.mjs          # Enugu
node --env-file=.env scripts/index-pharmacies.mjs --all    # every state
```

`/api/pharmacies/search` and the assistant's pharmacy lookup then search that index, with typo tolerance. Without it they search the Enugu list bundled with the app.

**Postman.** Import `postman/Homeward.postman_collection.json` and set the collection variables. It has the PayPal sandbox calls Homeward makes, in order, and Homeward's own endpoints.

## Licence

MIT. See [LICENSE](LICENSE).
