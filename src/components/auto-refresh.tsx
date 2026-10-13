'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Re-fetches the server-rendered page so a pickup shows up without a manual reload.
export function AutoRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
