'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      window.location.assign('/report');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Входим…' : 'Войти и открыть отчёт'}</button>
      </form>
    </main>
  );
}
