'use client';

import dynamic from 'next/dynamic';

// WebGL only runs in the browser; the fixed height keeps the cards from jumping.
const MiniScene = dynamic(() => import('./mini-scene'), { ssr: false });

export function StepScene({ model, className = 'h-[240px]' }: { model: string; className?: string }) {
  return (
    <div className={`dot-grid w-full rounded-[14px] bg-surface-muted ${className}`}>
      <MiniScene model={model} />
    </div>
  );
}
