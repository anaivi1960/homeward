'use client';

import type { ColDef, GridApi, ICellRendererParams, IRowNode } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LedgerRow } from '@/lib/ledger';
import { gridTheme, usd } from './grid-theme';
import { formatTime, StatusChip } from './status-chip';

type Tab = 'all' | 'action' | 'waiting' | 'done';
// What the grid's cells need besides their row: how to act on an order, and any failed attempt.
type Context = {
  act: (path: string, fields: Record<string, string>, failure: string, row: LedgerRow) => Promise<void>;
  errors: Record<string, string>;
  busy: string | undefined;
};
type Cell = ICellRendererParams<LedgerRow, unknown, Context>;

const needsAction = (row: LedgerRow) => row.problemStatus === 'open' || row.status === 'refund_due';
const tabs: { id: Tab; label: string; test: (row: LedgerRow) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'action', label: 'Needs you', test: needsAction },
  { id: 'waiting', label: 'Waiting for pickup', test: (row) => row.status === 'ready_for_pickup' },
  { id: 'done', label: 'Done', test: (row) => !needsAction(row) && row.status !== 'ready_for_pickup' },
];

const statusLabel = { ready_for_pickup: 'Ready for pickup', collected: 'Picked up', refund_due: 'Refund due', refunded: 'Refunded' };
const time = (iso: string | null | undefined) => (iso ? formatTime(new Date(iso)) : '');

function StatusCell({ data, node }: Cell) {
  if (!data || node.rowPinned) return null;
  return <StatusChip status={data.status} />;
}

// The next thing the pharmacy has to do for this order, as buttons.
function ActionCell({ data, node, context }: Cell) {
  if (!data || node.rowPinned) return null;
  const error = context.errors[data.id];
  const busy = context.busy === data.id;
  const button = 'rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-text disabled:opacity-40';

  if (data.problemStatus === 'open' && data.reportId) {
    const answer = (value: string) =>
      context.act('resolve', { reportId: data.reportId!, answer: value }, 'Could not save the answer', data);
    return (
      <span className="flex h-full items-center gap-2">
        <button type="button" disabled={busy} onClick={() => answer('replaced')} className={`${button} bg-primary text-on-primary`}>
          Replace
        </button>
        <button type="button" disabled={busy} onClick={() => answer('refund')} className={button}>
          Refund
        </button>
      </span>
    );
  }
  if (data.status === 'refund_due') {
    return (
      <span className="flex h-full items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => context.act('refund-check', { paymentId: data.id }, 'PayPal shows no refund yet', data)}
          className={`${button} bg-primary text-on-primary`}
        >
          I&rsquo;ve refunded it
        </button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </span>
    );
  }
  if (data.status === 'ready_for_pickup') {
    return <span className={`text-xs ${error ? 'text-danger' : 'text-text-muted'}`}>{error ?? 'Type the code in “Pickup code”'}</span>;
  }
  return <span className="text-xs text-text-muted">{data.problemStatus === 'replaced' ? 'Replaced' : '—'}</span>;
}

// The pharmacy's orders as a working ledger: type a pickup code straight into the grid, answer
// problem reports, confirm refunds, filter, sort and export. Polls so new orders appear by themselves.
export function PharmacyLedger({ merchantId, initialRows }: { merchantId: string; initialRows: LedgerRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>();
  const api = useRef<GridApi<LedgerRow>>(null);

  const refresh = useCallback(async () => {
    // Replacing the rows mid-edit would throw away a half-typed code.
    if (api.current?.getEditingCells().length) return;
    const res = await fetch(`/api/merchant/${merchantId}/orders`, { cache: 'no-store' }).catch(() => undefined);
    if (res?.ok) setRows((await res.json()).rows);
  }, [merchantId]);

  useEffect(() => {
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const act = useCallback<Context['act']>(
    async (path, fields, failure, row) => {
      setBusy(row.id);
      const res = await fetch(`/merchant/${merchantId}/${path}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(fields),
      }).catch(() => undefined);
      setBusy(undefined);
      setErrors((current) => {
        const { [row.id]: _cleared, ...rest } = current;
        return res?.ok ? rest : { ...rest, [row.id]: failure };
      });
      await refresh();
    },
    [merchantId, refresh],
  );

  const context = useMemo<Context>(() => ({ act, errors, busy }), [act, errors, busy]);
  // The action cells read their state from the context, which AG Grid does not watch.
  useEffect(() => api.current?.refreshCells({ columns: ['action'], force: true }), [context]);
  useEffect(() => api.current?.onFilterChanged(), [tab]);

  const columns = useMemo<ColDef<LedgerRow>[]>(
    () => [
      {
        headerName: 'Status',
        colId: 'status',
        valueGetter: ({ data }) => (data ? statusLabel[data.status] : ''),
        cellRenderer: StatusCell,
        width: 190,
        pinned: 'left',
      },
      { headerName: 'For', field: 'beneficiary', width: 130 },
      { headerName: 'Medicine', field: 'items', flex: 2, minWidth: 220, tooltipField: 'items' },
      {
        headerName: 'Paid to you',
        field: 'amountUsd',
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        valueFormatter: ({ value }) => (value == null ? '' : usd(value)),
        cellClass: 'font-mono',
        width: 140,
      },
      {
        headerName: 'Pickup code',
        colId: 'code',
        // The code is never sent to this page; the cell only takes what the customer says.
        valueGetter: () => '',
        valueSetter: () => false,
        valueParser: ({ newValue }) => String(newValue ?? '').trim().toUpperCase(),
        editable: ({ data, node }) => !node.rowPinned && data?.status === 'ready_for_pickup',
        cellEditorParams: { maxLength: 6 },
        cellClass: 'font-mono tracking-[0.2em]',
        // A rule, not a class, so the "Type code" hint goes once the order is picked up.
        cellClassRules: { 'ledger-code': ({ data }) => data?.status === 'ready_for_pickup' },
        sortable: false,
        filter: false,
        width: 150,
      },
      { headerName: 'Next step', colId: 'action', cellRenderer: ActionCell, sortable: false, filter: false, minWidth: 260, flex: 1 },
      {
        headerName: 'Problem',
        field: 'problem',
        valueFormatter: ({ value, data }) => (value ? `${value}${data?.problemDetails ? `: ${data.problemDetails}` : ''}` : ''),
        tooltipValueGetter: ({ data }) => data?.problemDetails ?? data?.problem ?? '',
        minWidth: 200,
        flex: 1,
      },
      { headerName: 'Answer by', field: 'answerBy', valueFormatter: ({ value, data }) => (data?.problemStatus === 'open' ? time(value) : ''), width: 170 },
      { headerName: 'Paid', field: 'paidAt', valueFormatter: ({ value }) => time(value), sort: 'desc', width: 170 },
      { headerName: 'Picked up', field: 'collectedAt', valueFormatter: ({ value }) => time(value), width: 170 },
      { headerName: 'PayPal order', field: 'paypalOrderId', cellClass: 'font-mono text-xs', width: 200 },
    ],
    [],
  );

  // Totals follow the rows the filters leave visible.
  const [totals, setTotals] = useState<Partial<LedgerRow>[]>([]);
  const retotal = useCallback(() => {
    const shown: LedgerRow[] = [];
    api.current?.forEachNodeAfterFilter((node) => node.data && shown.push(node.data));
    const kept = shown.filter((row) => row.status === 'ready_for_pickup' || row.status === 'collected');
    const next = {
      id: 'total',
      beneficiary: `${shown.length} ${shown.length === 1 ? 'order' : 'orders'}`,
      items: 'Paid to you, less refunds',
      amountUsd: kept.reduce((sum, row) => sum + row.amountUsd, 0),
    };
    // Only replace the totals row when it changes, or setting it would re-trigger this.
    setTotals((current) => (current[0]?.beneficiary === next.beneficiary && current[0]?.amountUsd === next.amountUsd ? current : [next]));
  }, []);

  const counts = useMemo(() => Object.fromEntries(tabs.map((t) => [t.id, rows.filter(t.test).length])), [rows]);
  const passes = useCallback((node: IRowNode<LedgerRow>) => !node.data || tabs.find((t) => t.id === tab)!.test(node.data), [tab]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-full border border-border bg-surface p-1 text-xs font-medium">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`rounded-full px-3 py-1.5 ${tab === t.id ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'}`}
            >
              {t.label} · {counts[t.id]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders"
          aria-label="Search orders"
          name="search"
          className="min-h-10 min-w-40 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-text"
        />
        <button
          type="button"
          onClick={() => api.current?.exportDataAsCsv({ fileName: `${merchantId}-orders.csv`, columnKeys: ['status', 'beneficiary', 'items', 'amountUsd', 'problem', 'paidAt', 'collectedAt', 'paypalOrderId'] })}
          className="btn btn-ghost min-h-10! px-4! text-sm"
        >
          Export CSV
        </button>
      </div>

      <AgGridReact<LedgerRow>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={{ sortable: true, filter: true, resizable: true, enableCellChangeFlash: true }}
        context={context}
        getRowId={({ data }) => data.id}
        domLayout="autoHeight"
        quickFilterText={search}
        isExternalFilterPresent={() => tab !== 'all'}
        doesExternalFilterPass={passes}
        pinnedBottomRowData={totals}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        tooltipShowDelay={300}
        rowClassRules={{
          'ledger-problem': ({ data }) => data?.problemStatus === 'open',
          'ledger-refund': ({ data }) => data?.status === 'refund_due',
        }}
        onGridReady={(event) => {
          api.current = event.api;
          retotal();
        }}
        onModelUpdated={retotal}
        onCellEditingStopped={(event) => {
          const code = String(event.newValue ?? '').trim().toUpperCase();
          if (event.column.getColId() !== 'code' || !event.data || !code) return;
          void act('confirm', { paymentId: event.data.id, code }, `“${code}” is not this order’s code`, event.data);
        }}
        overlayNoRowsTemplate="No orders yet. They appear here as soon as a family pays."
      />
    </div>
  );
}
