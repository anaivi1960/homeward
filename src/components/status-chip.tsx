const styles = {
  ready_for_pickup: { label: 'Ready for pickup', icon: '◷', color: 'text-warning' },
  collected: { label: 'Collected', icon: '✓', color: 'text-success' },
} as const;

export function StatusChip({ status }: { status: keyof typeof styles }) {
  const s = styles[status];
  return (
    <span className={`shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

export const formatTime = (date: Date) =>
  date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
