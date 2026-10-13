import { jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export type PlanItem = { name: string; quantity: number; lineUsd: string };

// Tables are created by scripts/migrate.mjs; keep the two in step.
export const carePlans = pgTable('care_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  beneficiary: text('beneficiary').notNull(),
  merchantId: text('merchant_id').notNull(),
  items: jsonb('items').$type<PlanItem[]>().notNull(),
  amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),
  nairaEstimate: text('naira_estimate').notNull(),
  status: text('status').$type<'awaiting_approval' | 'paid'>().notNull().default('awaiting_approval'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => carePlans.id),
  merchantId: text('merchant_id').notNull(),
  paypalOrderId: text('paypal_order_id').notNull().unique(),
  amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),
  status: text('status').$type<'ready_for_pickup' | 'collected'>().notNull().default('ready_for_pickup'),
  pickupCode: text('pickup_code').notNull(),
  beneficiaryToken: text('beneficiary_token').notNull().unique(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  collectedAt: timestamp('collected_at', { withTimezone: true }),
});
