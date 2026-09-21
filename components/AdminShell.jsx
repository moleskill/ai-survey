'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ITEMS = [
  { href: '/admin', label: 'Панель', exact: true },
  { href: '/admin/events', label: 'Мероприятия' },
  { href: '/admin/gallery', label: 'Фото' },
  { href: '/admin/concept', label: 'Концепция' },
  { href: '/report', label: 'Отчёты' },
];

export function AdminHeader() {
  const pathname = usePathname() || '';

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      window.location.assign('/admin');
    }
  }

  return (
    <header className="admin-bar no-print">
      <Link href="/" className="brand">
        <i aria-hidden="true">✦</i> Администратор
      </Link>
      <nav aria-label="Разделы админки">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <Link href="/" className="nav-link">
          На сайт
        </Link>
        <button type="button" className="nav-link nav-button" onClick={logout}>
          Выйти
        </button>
      </nav>
    </header>
  );
}

// Обёртка страниц админки: проверяет сессию, рисует шапку и заголовок.
export default function AdminShell({ title, lead, children }) {
  const [state, setState] = useState('checking'); // checking | ok | error

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/session')
      .then((res) => {
        if (!alive) return;
        if (res.status === 401) window.location.assign('/admin');
        else setState(res.ok ? 'ok' : 'error');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);

  if (state !== 'ok') {
    return (
      <main className="admin">
        <p className="empty-state">
          {state === 'checking' ? 'Проверяем доступ…' : 'Не удалось проверить доступ. Обновите страницу.'}
        </p>
      </main>
    );
  }

  return (
    <div className="admin">
      <AdminHeader />
      <main>
        <h1 className="admin-title">{title}</h1>
        {lead && <p className="admin-lead">{lead}</p>}
        {children}
      </main>
    </div>
  );
}
