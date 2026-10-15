import Link from 'next/link';
import { Nav } from './nav';

// Wordmark with the green diamond that marks people in the landing scene.
export function Brand({ href = '/', suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <span aria-hidden className="block size-2.5 rotate-45 bg-signal" />
      Homeward
      {suffix && <span className="label text-text-muted">{suffix}</span>}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-4">
        <Brand />
        <Nav />
      </div>
    </header>
  );
}
