# Homeward

Pay for what family at home needs, and see proof it arrived.

Homeward lets someone abroad order medicine for family in Nigeria by telling an AI agent what is needed. The agent finds a verified pharmacy, the payer approves the payment with PayPal, and the money goes to the pharmacy, not to an individual. The family member collects with a pickup code, and the payer sees the moment it is picked up.

Built for the PayPal AI Hackathon 2026. It runs entirely in the PayPal sandbox; no real money moves.

## Status

Work in progress.

- Working: landing page with a 3D scene, chat with the agent, pharmacy search, order drafting, PayPal order paid directly to a pharmacy's sandbox account, Postgres storage, pickup codes, family pickup page (`/b/<token>`), pharmacy portal (`/merchant/ndidi-pharmacy`), orders and pickups (`/payments`).
- Awaiting one full run with a real sandbox approval: capture on return from PayPal through to the pickup code.
- Not built yet: receipt verification, recurring orders, webhooks, pharmacy login, delivery tracking.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- 3D landing scene modelled and animated in Blender (`assets/homeward-scene.blend`), shown with three.js
- Claude through the Vercel AI SDK
- PayPal Orders API and the [PayPal Agent Toolkit](https://github.com/paypal/agent-toolkit)

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

## Licence

MIT. See [LICENSE](LICENSE).
