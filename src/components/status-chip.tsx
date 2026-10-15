const styles = {
  ready_for_pickup: { label: 'Ready for pickup', chip: 'border border-text text-text', dot: 'bg-signal animate-pulse' },
  collected: { label: 'Picked up', chip: 'bg-signal/15 text-accent', dot: 'bg-signal' },
  refund_due: { label: 'Refund due', chip: 'border border-warning text-warning', dot: 'bg-warning' },
  refunded: { label: 'Refunded', chip: 'bg-surface-muted text-text-muted', dot: 'bg-text-muted' },
} as const;

export function StatusChip({ status }: { status: keyof typeof styles }) {
  const s = styles[status];
  return (
    <span className={`label inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 ${s.chip}`}>
      <span className={`block size-1.5 rotate-45 ${s.dot}`} />
      {s.label}
    </span>
  );
}

export const formatTime = (date: Date) =>
  date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
