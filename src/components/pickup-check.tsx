'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { PickupCheckItem } from '@/db/schema';
import { shrinkImage } from '@/lib/shrink-image';

export type Check = {
  verdict: 'match' | 'mismatch' | 'unclear';
  summary: string;
  items: PickupCheckItem[];
  confirmedPickup: boolean;
  createdAt: Date;
};

const verdicts = {
  match: { label: 'Matches the order', tone: 'text-accent', dot: 'bg-signal' },
  mismatch: { label: 'Does not match the order', tone: 'text-danger', dot: 'bg-danger' },
  unclear: { label: 'Could not check everything', tone: 'text-warning', dot: 'bg-warning' },
} as const;

const marks = { yes: '✓', no: '✕', unclear: '?' } as const;

// What Homeward's AI read on the family member's photo. Shown to them, the payer and on the receipt.
export function CheckSummary({ check, paymentId }: { check: Check; paymentId: string }) {
  const v = verdicts[check.verdict];
  return (
    <div className="rounded-control bg-surface-muted p-4 text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- served by our own route, already small */}
      <img
        src={`/api/orders/${paymentId}/pickup-photo?v=${check.createdAt.getTime()}`}
        alt="Photo of the medicine as collected"
        className="aspect-4/3 w-full max-w-sm rounded-control border border-border object-cover"
      />
      <p className="label mt-4 text-text-muted">Checked by Homeward AI</p>
      <p className={`mt-1 flex items-center gap-2 font-semibold ${v.tone}`}>
        <span className={`block size-2 rotate-45 ${v.dot}`} />
        {v.label}
      </p>
      <p className="mt-2">{check.summary}</p>
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {check.items.map((item) => (
          <li key={item.name} className="flex gap-2">
            <span
              aria-label={item.seen}
              className={`w-4 shrink-0 text-center font-semibold ${item.seen === 'yes' ? 'text-accent' : item.seen === 'no' ? 'text-danger' : 'text-warning'}`}
            >
              {marks[item.seen]}
            </span>
            <span>
              {item.name}
              {item.note && <span className="text-text-muted"> · {item.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// On the family member's page: photograph what they collected so Homeward can check it and tell
// the payer. A matching photo also confirms the pickup if the pharmacy has not entered the code yet.
export function PickupCheck({ token, waiting }: { token: string; waiting: boolean }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'checking' | 'failed'>('idle');

  async function upload(file: File | undefined) {
    if (!file) return;
    setState('checking');
    try {
      const image = await shrinkImage(file, 1280, 0.8);
      const res = await fetch('/api/orders/pickup-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, image }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('idle');
      router.refresh();
    } catch {
      setState('failed');
    } finally {
      if (picker.current) picker.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={picker} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <button type="button" onClick={() => picker.current?.click()} disabled={state === 'checking'} className="btn w-full">
        {state === 'checking' ? (
          <span className="flex items-center gap-2">
            <span className="block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Checking your photo…
          </span>
        ) : waiting ? (
          'Got it? Take a photo of the medicine'
        ) : (
          'Take a photo of the medicine'
        )}
      </button>
      <p className={`text-sm ${state === 'failed' ? 'text-danger' : 'text-text-muted'}`}>
        {state === 'failed'
          ? 'The photo could not be checked. Try again.'
          : 'Lay the packs flat with the names facing up. Homeward checks them against the order and lets the person who paid know.'}
      </p>
    </div>
  );
}
