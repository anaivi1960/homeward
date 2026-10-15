'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { shrinkImage } from '@/lib/shrink-image';

// On the pharmacy counter: take or choose a photo of an order as it is handed over. The payer
// sees it on their order and receipt.
export function HandoverPhoto({ merchantId, paymentId, hasPhoto }: { merchantId: string; paymentId: string; hasPhoto: boolean }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  const [version, setVersion] = useState(0);

  async function upload(file: File | undefined) {
    if (!file) return;
    setState('sending');
    try {
      const image = await shrinkImage(file, 1024, 0.75);
      const res = await fetch(`/merchant/${merchantId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, image }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('idle');
      setVersion((v) => v + 1);
      router.refresh();
    } catch {
      setState('failed');
    } finally {
      if (picker.current) picker.current.value = '';
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already small
        <img
          src={`/api/orders/${paymentId}/photo?v=${version}`}
          alt="Handover photo"
          className="size-16 rounded-control border border-border object-cover"
        />
      )}
      <input ref={picker} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => picker.current?.click()}
        disabled={state === 'sending'}
        className="btn btn-ghost min-h-10! px-4! text-sm"
      >
        {state === 'sending' ? 'Uploading…' : hasPhoto ? 'Replace handover photo' : 'Add handover photo'}
      </button>
      <span className={`text-xs ${state === 'failed' ? 'text-danger' : 'text-text-muted'}`}>
        {state === 'failed'
          ? 'The photo did not upload. Try again.'
          : hasPhoto
            ? 'The family can see this photo.'
            : 'Optional: a photo of the bag shows the family it was handed over.'}
      </span>
    </div>
  );
}
