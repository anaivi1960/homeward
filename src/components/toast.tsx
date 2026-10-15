'use client';

import { useEffect, useState } from 'react';

// A confirmation that pops up at the top of the screen and goes away by itself.
// `clearParam` names a query parameter to drop from the address, so a reload does not show it again.
export function Toast({ title, detail, clearParam }: { title: string; detail?: string; clearParam?: string }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (clearParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete(clearParam);
      window.history.replaceState(null, '', url);
    }
    const id = setTimeout(() => setOpen(false), 7000);
    return () => clearTimeout(id);
  }, [clearParam]);

  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="toast fixed top-4 left-1/2 z-50 flex w-[min(92vw,440px)] items-start gap-3 rounded-card border border-signal bg-surface p-4 shadow-[0_12px_40px_rgb(10_11_13/0.16)]"
    >
      <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-signal text-sm font-bold text-on-primary">
        ✓
      </span>
      <div className="flex-1">
        <p className="font-semibold tracking-tight">{title}</p>
        {detail && <p className="mt-0.5 text-sm text-text-muted">{detail}</p>}
      </div>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss" className="text-text-muted hover:text-text">
        ✕
      </button>
    </div>
  );
}
