'use client';

import dynamic from 'next/dynamic';

// WebGL only runs in the browser; the fixed height keeps the cards from jumping.
const MiniScene = dynamic(() => import('./mini-scene'), { ssr: false });

export function StepScene({ model }: { model: string }) {
  return (
    <div className="dot-grid h-[240px] w-full rounded-[14px] bg-surface-muted">
      <MiniScene model={model} />
    </div>
  );
}
