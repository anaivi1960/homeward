import type { Allowance } from '@/lib/allowances';

// A bar showing a family member's monthly allowance: spent so far, plus `adding` if an order
// is about to be approved.
export function AllowanceMeter({ allowance, adding = 0 }: { allowance: Allowance; adding?: number }) {
  const { monthlyUsd, spentUsd } = allowance;
  const pct = (value: number) => `${Math.min(100, (value / monthlyUsd) * 100)}%`;
  const after = spentUsd + adding;
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">{allowance.beneficiary}&rsquo;s allowance</span>
        <span className="font-mono tabular-nums text-text-muted">
          ${after.toFixed(2)} of ${monthlyUsd.toFixed(2)} this month
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${allowance.beneficiary}'s allowance used`}
        aria-valuemin={0}
        aria-valuemax={monthlyUsd}
        aria-valuenow={Math.min(after, monthlyUsd)}
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-border"
      >
        {adding > 0 && (
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${after > monthlyUsd ? 'bg-warning' : 'bg-signal/45'}`}
            style={{ width: pct(after) }}
          />
        )}
        <span className="absolute inset-y-0 left-0 rounded-full bg-signal" style={{ width: pct(spentUsd) }} />
      </div>
    </div>
  );
}
