import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/brand';
import { PharmacyLedger } from '@/components/pharmacy-ledger';
import { ledgerRows } from '@/lib/ledger';
import { getMerchant } from '@/lib/merchants';

export const dynamic = 'force-dynamic';

// The pharmacy's orders as a grid, for working through a busy day and for the books.
export default async function Ledger({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const merchant = getMerchant(merchantId);
  if (!merchant) notFound();
  const rows = await ledgerRows(merchant.id);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1280px] flex-col gap-4 p-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Brand suffix="Pharmacy" />
        <Link href={`/merchant/${merchant.id}`} className="text-sm text-text-muted hover:text-text">
          ← Counter view
        </Link>
      </div>
      <div className="mt-6">
        <p className="label text-text-muted">{merchant.city} · Order ledger</p>
        <h1 className="mt-3 text-[36px] leading-[1.05] font-semibold sm:text-[44px]">{merchant.name}</h1>
        <p className="mt-3 max-w-[70ch] text-text-muted">
          Every order paid to you. Type a customer&rsquo;s pickup code into its row to confirm the handover, answer
          problem reports, and export the lot for your books.
        </p>
      </div>
      <PharmacyLedger merchantId={merchant.id} initialRows={rows} />
    </main>
  );
}
