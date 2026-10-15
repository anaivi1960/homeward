'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/app', label: 'Order', short: 'Order' },
  { href: '/pharmacies', label: 'Pharmacies', short: 'Pharmacies' },
  { href: '/payments', label: 'Orders & pickups', short: 'Orders' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4 text-sm text-text-muted sm:gap-5">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={active ? 'font-medium text-text' : 'hover:text-text'}
          >
            <span className="sm:hidden">{link.short}</span>
            <span className="max-sm:hidden">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
