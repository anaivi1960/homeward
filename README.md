# Homeward

Pay for what family at home needs, and see proof it arrived.

Homeward lets someone abroad cover a relative's needs in Nigeria by telling an AI agent what to pay for, instead of sending cash. The agent finds a vetted local merchant, drafts a care plan, and the payer approves the payment with PayPal. The money goes to the merchant, not to an individual.

Built for the PayPal AI Hackathon 2026. It runs entirely in the PayPal sandbox; no real money moves.

## Status

Work in progress.

- Working: chat with the agent, merchant search, care plan drafting, PayPal order paid directly to a merchant's sandbox account, capture on return.
- Not built yet: database (plans are held in memory), merchant portal, beneficiary pickup page, receipt verification, recurring plans, webhooks.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Claude through the Vercel AI SDK
- PayPal Orders API and the [PayPal Agent Toolkit](https://github.com/paypal/agent-toolkit)

## Run it locally

Requires Node 20 or later.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill it in. You need a PayPal sandbox REST app, one personal sandbox account (the payer), four business sandbox accounts (Homeward plus three merchants), and a Claude API key.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000, ask for something (for example "Pay for Mum's blood-pressure medicine in Enugu"), and approve the plan with the personal sandbox account.

`node --env-file=.env scripts/gate-order.mjs` checks that your sandbox app can create an order naming a merchant as payee.

## Licence

MIT. See [LICENSE](LICENSE).
