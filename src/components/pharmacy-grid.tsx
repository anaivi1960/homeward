'use client';

import type { ColDef, GridApi } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WellaPharmacy } from '@/lib/wella-enugu';
import { gridTheme } from './grid-theme';

// The partner directory as a grid: search, sort, filter and export it, and click a row to
// find that pharmacy on the map. Selection is shared with the map through `selected`.
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
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(pharmacies.length);

  // A pharmacy picked on the map selects its row and scrolls it into view.
  useEffect(() => {
    const grid = api.current;
    if (!grid) return;
    const node = selected ? grid.getRowNode(selected) : undefined;
    if (!node) return grid.deselectAll();
    if (!node.isSelected()) node.setSelected(true, true);
    grid.ensureNodeVisible(node, 'middle');
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
    <div className="flex flex-col gap-3">
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
          {shown} of {pharmacies.length}
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
        rowData={pharmacies}
        columnDefs={columns}
        defaultColDef={{ sortable: true, filter: true, resizable: true }}
        getRowId={({ data }) => data.code}
        domLayout="autoHeight"
        quickFilterText={search}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        tooltipShowDelay={300}
        onGridReady={(event) => {
          api.current = event.api;
        }}
        onModelUpdated={(event) => setShown(event.api.getDisplayedRowCount())}
        onSelectionChanged={(event) => {
          if (event.source === 'api') return;
          onSelect(event.api.getSelectedRows()[0]?.code);
        }}
        overlayNoRowsTemplate="No pharmacy matches that search."
      />
    </div>
  );
}
