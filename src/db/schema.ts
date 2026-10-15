import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  status: text('status').$type<'ready_for_pickup' | 'collected' | 'refund_due' | 'refunded'>().notNull().default('ready_for_pickup'),
  pickupCode: text('pickup_code').notNull(),
  beneficiaryToken: text('beneficiary_token').notNull().unique(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  collectedAt: timestamp('collected_at', { withTimezone: true }),
});

export const problemReasons = {
  wrong_item: 'Wrong medicine or strength',
  expired: 'Expired or close to expiry',
  damaged: 'Damaged or opened pack',
  suspected_fake: 'Looks fake',
  other: 'Something else',
} as const;
export type ProblemReason = keyof typeof problemReasons;

// A complaint about medicine that was picked up. The pharmacy answers it: replaced, or refund.
export const problemReports = pgTable('problem_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .notNull()
    .unique()
    .references(() => payments.id),
  reportedBy: text('reported_by').$type<'payer' | 'beneficiary'>().notNull(),
  reason: text('reason').$type<ProblemReason>().notNull(),
  details: text('details').notNull().default(''),
  status: text('status').$type<'open' | 'replaced' | 'refund'>().notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// A repeat order: every `everyDays` a fresh order is drafted from the same items for the payer
// to approve. `draftPlanId` is the latest one drafted.
export const refills = pgTable('refills', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourcePlanId: uuid('source_plan_id')
    .notNull()
    .unique()
    .references(() => carePlans.id),
  beneficiary: text('beneficiary').notNull(),
  merchantId: text('merchant_id').notNull(),
  items: jsonb('items').$type<PlanItem[]>().notNull(),
  everyDays: integer('every_days').notNull().default(30),
  nextDue: timestamp('next_due', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
  draftPlanId: uuid('draft_plan_id').references(() => carePlans.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// How much the payer means to spend on one family member each calendar month.
// `key` is the lower-cased name the payer uses ("mum").
export const allowances = pgTable('allowances', {
  key: text('key').primaryKey(),
  beneficiary: text('beneficiary').notNull(),
  monthlyUsd: numeric('monthly_usd', { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// A photo the pharmacy takes of the order as it is handed over, stored as a small JPEG data URL.
export const handoverPhotos = pgTable('handover_photos', {
  paymentId: uuid('payment_id')
    .primaryKey()
    .references(() => payments.id),
  image: text('image').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
