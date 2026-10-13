'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { WellaPharmacy } from '@/lib/wella-enugu';
import { PharmacyGrid } from './pharmacy-grid';

// WebGL only runs in the browser; the fixed height keeps the grid from jumping.
const Scene = dynamic(() => import('./pharmacy-map-scene'), {
  ssr: false,
  loading: () => <p className="label grid h-full place-items-center text-text-muted">Loading map</p>,
});

// Diorama of the state with the same pharmacies in a grid underneath; picking one in either highlights it in both.
export function PharmacyMap({ pharmacies }: { pharmacies: WellaPharmacy[] }) {
  const [selected, setSelected] = useState<string>();

  return (
    <>
      <div className="dot-grid h-[420px] w-full rounded-card bg-surface-muted sm:h-[540px]">
        <Scene pharmacies={pharmacies} selected={selected} onSelect={setSelected} />
      </div>
      <p className="label text-text-muted">
        Illustration, not to scale: pharmacies are grouped by neighbourhood · Boundary © OpenStreetMap contributors
      </p>
      <div className="mt-4">
        <PharmacyGrid pharmacies={pharmacies} selected={selected} onSelect={setSelected} />
      </div>
    </>
  );
}
