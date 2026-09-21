'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/#courses', label: 'Курсы' },
  { href: '/#how', label: 'Как это работает' },
];

export default function SiteNav() {
  const pathname = usePathname() || '/';
  return (
    <header className="site-nav">
      <Link href="/" className="brand">
        <i aria-hidden="true">M</i> MoleSkill
      </Link>
      <nav aria-label="Разделы сайта">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
