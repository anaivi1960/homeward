import { removeAllowance, setAllowance } from '@/lib/allowances';
import { respond } from '@/lib/respond';

// The payer sets or removes a monthly allowance for a family member.
export async function POST(request: Request) {
  const form = await request.formData();
  const beneficiary = String(form.get('beneficiary') ?? '');
  const ok =
    form.get('action') === 'remove'
      ? await removeAllowance(beneficiary)
      : await setAllowance(beneficiary, Number(form.get('monthlyUsd')));
  return respond(request, '/payments', ok);
}
