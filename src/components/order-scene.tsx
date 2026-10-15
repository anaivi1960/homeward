'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Stage, Stages } from './landing/scene';
import { SceneSpinner } from './scene-spinner';

const Scene = dynamic(() => import('./landing/scene'), { ssr: false });

// The Houston-to-Enugu diorama played up to where this order has got to: on its way, ready for
// pickup, or picked up.
export function OrderScene({
  stage,
  stages,
  places,
  className = 'h-[260px] sm:h-[300px]',
}: {
  stage: Stage;
  stages: Stages;
  places: { us: string; ng: string };
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  return (
    <div className={`dot-grid relative isolate w-full overflow-hidden rounded-[14px] bg-surface-muted ${className}`}>
      {!ready && <SceneSpinner />}
      <Scene hold={stage} stages={stages} places={places} onReady={() => setReady(true)} />
    </div>
  );
}
