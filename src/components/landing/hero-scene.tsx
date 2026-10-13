'use client';

import dynamic from 'next/dynamic';

// WebGL only runs in the browser; the parent sets the size so the page doesn't jump.
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <p className="label grid h-full place-items-center text-text-muted">Loading scene</p>,
});

export function HeroScene() {
  return (
    <div className="size-full">
      <Scene />
    </div>
  );
}
