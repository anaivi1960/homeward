'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SceneSpinner } from '../scene-spinner';

// WebGL only runs in the browser; the fixed height keeps the cards from jumping.
const MiniScene = dynamic(() => import('./mini-scene'), { ssr: false });

export function StepScene({ model, className = 'h-[240px]' }: { model: string; className?: string }) {
  const [ready, setReady] = useState(false);
  return (
    <div className={`dot-grid relative isolate w-full rounded-[14px] bg-surface-muted ${className}`}>
      {!ready && <SceneSpinner />}
      <MiniScene model={model} onReady={() => setReady(true)} />
    </div>
  );
}
