import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { allowances, carePlans, payments } from '@/db/schema';

// A monthly spending allowance per family member. Spending is what was paid this calendar
// month for that person (by the name the payer uses), not counting refunded orders.
export type Allowance = { beneficiary: string; monthlyUsd: number; spentUsd: number; remainingUsd: number };

const keyOf = (beneficiary: string) => beneficiary.trim().toLowerCase();
const startOfMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

async function spentThisMonth(key: string) {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amountUsd}), 0)` })
    .from(payments)
    .innerJoin(carePlans, eq(payments.planId, carePlans.id))
    .where(and(eq(sql`lower(trim(${carePlans.beneficiary}))`, key), gte(payments.paidAt, startOfMonth()), ne(payments.status, 'refunded')));
  return Number(row?.total ?? 0);
}

function shape(row: typeof allowances.$inferSelect, spentUsd: number): Allowance {
  const monthlyUsd = Number(row.monthlyUsd);
  return { beneficiary: row.beneficiary, monthlyUsd, spentUsd, remainingUsd: Math.max(0, monthlyUsd - spentUsd) };
}

export async function allowanceFor(beneficiary: string): Promise<Allowance | undefined> {
  const key = keyOf(beneficiary);
  const [row] = await db.select().from(allowances).where(eq(allowances.key, key));
  return row && shape(row, await spentThisMonth(key));
}

export async function listAllowances(): Promise<Allowance[]> {
  const rows = await db.select().from(allowances).orderBy(allowances.beneficiary);
  return Promise.all(rows.map(async (row) => shape(row, await spentThisMonth(row.key))));
}

export async function setAllowance(beneficiary: string, monthlyUsd: number) {
  const name = beneficiary.trim().slice(0, 60);
  if (!name || !Number.isFinite(monthlyUsd) || monthlyUsd <= 0 || monthlyUsd > 10_000) return false;
  const values = { key: keyOf(name), beneficiary: name, monthlyUsd: monthlyUsd.toFixed(2), updatedAt: new Date() };
  await db.insert(allowances).values(values).onConflictDoUpdate({ target: allowances.key, set: values });
  return true;
}

export async function removeAllowance(beneficiary: string) {
  await db.delete(allowances).where(eq(allowances.key, keyOf(beneficiary)));
  return true;
}
