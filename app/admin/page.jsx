'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/AdminShell';
import Icon from '@/components/Icon';

const TILES = [
  { href: '/admin/events', icon: 'calendar', title: 'Мероприятия', text: 'Добавить, изменить, отметить проведённым, скрыть или удалить.' },
  { href: '/admin/gallery', icon: 'image', title: 'Фотографии', text: 'Загрузить фото к мероприятиям, подписать и удалить.' },
  { href: '/admin/concept', icon: 'text', title: 'Концепция года', text: 'Тема, цель, задачи и направления работы на главной.' },
  { href: '/report', icon: 'chart', title: 'Отчёты и эффект курсов', text: 'Опрос, результаты MoleSkill до/после, графики и PDF.' },
];

export default function AdminPage() {
  const [state, setState] = useState('checking'); // checking | login | dashboard
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/session')
      .then((res) => alive && setState(res.ok ? 'dashboard' : 'login'))
      .catch(() => alive && setState('login'));
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Не удалось выполнить вход');
      setPassword('');
      setState('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (state === 'checking') {
    return (
      <main className="admin">
        <p className="empty-state">Проверяем доступ…</p>
      </main>
    );
  }

  if (state === 'dashboard') {
    return (
      <div className="admin">
        <AdminHeader />
        <main>
          <h1 className="admin-title">Панель администратора</h1>
          <p className="admin-lead">Управляйте содержимым сайта, фотогалереей и следите, как MoleSkill помогает ученикам.</p>
          <div className="admin-tiles">
            {TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} className="tile">
                <span className="tile-icon">
                  <Icon name={tile.icon} size={24} />
                </span>
                <strong>{tile.title}</strong>
                <span className="tile-text">{tile.text}</span>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="gate">
      <div className="gate-mark" aria-hidden="true">✦</div>
      <p className="eyebrow">Закрытый раздел</p>
      <h1>Вход для администратора</h1>
      <p>Введите почту и пароль, заданные в переменных окружения сайта.</p>
      <form onSubmit={onSubmit}>
        <label className="field-label">Почта
          <input className="field" type="email" autoComplete="username" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field-label">Пароль
          <input className="field" type="password" autoComplete="current-password" placeholder="Введите пароль" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button>
      </form>
    </main>
  );
}
