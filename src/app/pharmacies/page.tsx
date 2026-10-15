import { AppHeader } from '@/components/brand';
import { PharmacyMap } from '@/components/pharmacy-map';
import { wellaEnugu } from '@/lib/wella-enugu';

// Where the partner pharmacies are. Enugu only for the demo.
export default function Pharmacies() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-[960px] flex-col gap-4 p-4 pt-8 pb-20 sm:pt-14">
        <div>
          <p className="label text-text-muted">Pharmacies · Enugu</p>
          <h1 className="mt-3 text-[36px] leading-[1.05] font-semibold sm:text-[44px]">
            {wellaEnugu.length} pharmacies in Enugu.
          </h1>
          <p className="mt-3 max-w-[52ch] text-text-muted">
            Partner pharmacies in Enugu State from the WellaHealth network. Pick one on the map or in the table.
          </p>
        </div>
        <PharmacyMap pharmacies={wellaEnugu} />
      </main>
    </>
  );
}
