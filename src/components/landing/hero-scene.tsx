'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SceneSpinner } from '../scene-spinner';

// WebGL only runs in the browser; the parent sets the size so the page doesn't jump.
const Scene = dynamic(() => import('./scene'), { ssr: false });

export function HeroScene() {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative isolate size-full">
      {!ready && <SceneSpinner />}
      <Scene onReady={() => setReady(true)} />
    </div>
  );
}
