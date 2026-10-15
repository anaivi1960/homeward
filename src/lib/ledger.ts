import { answerBy } from '@/components/problem-report';
import { problemReasons } from '@/db/schema';
import { listPayments } from './plans';

// One order as the pharmacy's ledger grid shows it. Deliberately leaves out the pickup code
// and the family link: the pharmacy must be told the code, not read it off a screen.
export type LedgerRow = {
  id: string;
  beneficiary: string;
  items: string;
  amountUsd: number;
  status: 'ready_for_pickup' | 'collected' | 'refund_due' | 'refunded';
  paidAt: string;
  collectedAt: string | null;
  paypalOrderId: string;
  problem: string | null;
  problemDetails: string | null;
  problemStatus: 'open' | 'replaced' | 'refund' | null;
  reportId: string | null;
  answerBy: string | null;
};

export async function ledgerRows(merchantId: string): Promise<LedgerRow[]> {
  const rows = await listPayments(merchantId);
  return rows.map(({ payment, plan, report }) => ({
    id: payment.id,
    beneficiary: plan.beneficiary,
    items: plan.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
    amountUsd: Number(payment.amountUsd),
    status: payment.status,
    paidAt: payment.paidAt.toISOString(),
    collectedAt: payment.collectedAt?.toISOString() ?? null,
    paypalOrderId: payment.paypalOrderId,
    problem: report ? problemReasons[report.reason] : null,
    problemDetails: report?.details || null,
    problemStatus: report?.status ?? null,
    reportId: report?.id ?? null,
    answerBy: report ? answerBy(report).toISOString() : null,
  }));
}
