'use client';

import dynamic from 'next/dynamic';

// WebGL only runs in the browser; reserve the space so the page doesn't jump.
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <p className="label grid h-full place-items-center text-text-muted">Loading scene</p>,
});

export function HeroScene() {
  return (
    <div className="h-[380px] w-full sm:h-[640px]">
      <Scene />
    </div>
  );
}
