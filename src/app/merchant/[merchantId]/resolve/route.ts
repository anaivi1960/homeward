import { resolveProblem } from '@/lib/plans';
import { respond } from '@/lib/respond';

// The pharmacy answers a problem report: replace the medicine, or refund it.
export async function POST(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const form = await request.formData();
  const answer = form.get('answer') === 'refund' ? 'refund' : 'replaced';
  const ok = await resolveProblem(merchantId, String(form.get('reportId')), answer);
  return respond(request, `/merchant/${merchantId}`, ok);
}
