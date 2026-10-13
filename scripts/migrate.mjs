// Creates the tables. Run: node --env-file=.env scripts/migrate.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);

await sql`
  create table if not exists care_plans (
    id uuid primary key default gen_random_uuid(),
    beneficiary text not null,
    merchant_id text not null,
    items jsonb not null,
    amount_usd numeric(10, 2) not null,
    naira_estimate text not null,
    status text not null default 'awaiting_approval',
    created_at timestamptz not null default now()
  )`;

await sql`
  create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references care_plans (id),
    merchant_id text not null,
    paypal_order_id text not null unique,
    amount_usd numeric(10, 2) not null,
    status text not null default 'ready_for_pickup',
    pickup_code text not null,
    beneficiary_token text not null unique,
    paid_at timestamptz not null default now(),
    collected_at timestamptz
  )`;

const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
console.log('tables:', tables.map((t) => t.table_name).join(', '));
