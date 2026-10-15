'use client';

import type { ColDef, GridApi } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WellaPharmacy } from '@/lib/wella-enugu';
import { gridTheme } from './grid-theme';

// The partner directory as a grid: search, sort, filter and export it. The pharmacy picked here
// or on the map is pinned as the first row and scrolled into view, so its details are always
// at the top of the table.
export function PharmacyGrid({
  pharmacies,
  selected,
  onSelect,
}: {
  pharmacies: WellaPharmacy[];
  selected: string | undefined;
  onSelect: (code: string | undefined) => void;
}) {
  const api = useRef<GridApi<WellaPharmacy>>(null);
  const top = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(pharmacies.length);

  const chosen = useMemo(() => pharmacies.filter((p) => p.code === selected), [pharmacies, selected]);
  const rest = useMemo(() => pharmacies.filter((p) => p.code !== selected), [pharmacies, selected]);

  // Bring the top of the table (search, header and the pinned row) on screen, moving the page
  // as little as possible so the map stays in view when there is room for both.
  useEffect(() => {
    if (!selected) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    top.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' });
  }, [selected]);

  const columns = useMemo<ColDef<WellaPharmacy>[]>(
    () => [
      { headerName: 'Pharmacy', field: 'name', flex: 2, minWidth: 200, cellClass: 'font-semibold' },
      { headerName: 'Neighbourhood', field: 'area', width: 190, sort: 'asc' },
      { headerName: 'Address', field: 'address', flex: 3, minWidth: 240, tooltipField: 'address' },
      { headerName: 'LGA', field: 'lga', width: 140 },
      { headerName: 'WellaHealth code', field: 'code', width: 170, cellClass: 'font-mono text-xs' },
    ],
    [],
  );

  return (
    <div className="relative flex flex-col gap-3">
      {/* Marks the part of the table that should be on screen after a pharmacy is picked. */}
      <div ref={top} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[210px] scroll-mt-20" />
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, street or neighbourhood"
          aria-label="Search pharmacies"
          name="search"
          className="min-h-10 min-w-40 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-text"
        />
        <p className="label text-text-muted">
          {shown + chosen.length} of {pharmacies.length}
        </p>
        <button
          type="button"
          onClick={() => api.current?.exportDataAsCsv({ fileName: 'wellahealth-enugu-pharmacies.csv' })}
          className="btn btn-ghost min-h-10! px-4! text-sm"
        >
          Export CSV
        </button>
      </div>

      <AgGridReact<WellaPharmacy>
        theme={gridTheme}
        rowData={rest}
        pinnedTopRowData={chosen}
        columnDefs={columns}
        defaultColDef={{ sortable: true, filter: true, resizable: true }}
        getRowId={({ data }) => data.code}
        domLayout="autoHeight"
        quickFilterText={search}
        tooltipShowDelay={300}
        rowClass="cursor-pointer"
        rowClassRules={{ 'grid-chosen': ({ node }) => node.rowPinned === 'top' }}
        onGridReady={(event) => {
          api.current = event.api;
        }}
        onModelUpdated={(event) => setShown(event.api.getDisplayedRowCount())}
        // Clicking the pinned row again lets it go.
        onRowClicked={({ data, node }) => onSelect(node.rowPinned ? undefined : data?.code)}
        overlayNoRowsTemplate="No pharmacy matches that search."
      />
    </div>
  );
}
