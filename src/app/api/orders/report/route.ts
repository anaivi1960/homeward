import type { ProblemReason } from '@/db/schema';
import { getPaymentByToken, reportProblem } from '@/lib/plans';
import { respond } from '@/lib/respond';

// "Report a problem" posts here, from the payer's order list or the family member's pickup page.
export async function POST(request: Request) {
  const form = await request.formData();
  const token = form.get('token');
  const report = {
    reason: String(form.get('reason')) as ProblemReason,
    details: String(form.get('details') ?? ''),
  };

  if (token) {
    const found = await getPaymentByToken(String(token));
    const ok = Boolean(found) && (await reportProblem({ ...report, paymentId: found!.payment.id, reportedBy: 'beneficiary' }));
    return respond(request, `/b/${token}`, ok);
  }

  const ok = await reportProblem({ ...report, paymentId: String(form.get('paymentId')), reportedBy: 'payer' });
  return respond(request, '/payments', ok);
}
