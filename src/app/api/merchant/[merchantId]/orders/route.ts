import { NextResponse } from 'next/server';
import { ledgerRows } from '@/lib/ledger';
import { getMerchant } from '@/lib/merchants';

// The rows behind the pharmacy ledger grid, which polls this to stay live.
export async function GET(_request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  if (!getMerchant(merchantId)) return NextResponse.json({ error: 'Unknown pharmacy' }, { status: 404 });
  return NextResponse.json({ rows: await ledgerRows(merchantId) });
}
