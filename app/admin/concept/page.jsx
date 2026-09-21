'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { adminFetch, jsonRequest } from '@/lib/adminFetch';

const toLines = (items) => items.join('\n');
const fromLines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const directionsToText = (items) => items.map((d) => `${d.name} | ${d.activities}`).join('\n');
const directionsFromText = (text) =>
  fromLines(text).map((line) => {
    const [name, ...rest] = line.split('|');
    return { name: name.trim(), activities: rest.join('|').trim() };
  });

export default function AdminConceptPage() {
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/concept')
      .then((data) =>
        setForm({
          year: data.concept.year || '',
          theme: data.concept.theme || '',
          goal: data.concept.goal || '',
          tasks: toLines(data.concept.tasks || []),
          directions: directionsToText(data.concept.directions || []),
        })
      )
      .catch((e) => setLoadError(e.message));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminFetch(
        '/api/admin/concept',
        jsonRequest('PUT', {
          concept: {
            year: form.year,
            theme: form.theme,
            goal: form.goal,
            tasks: fromLines(form.tasks),
            directions: directionsFromText(form.directions),
          },
        })
      );
      setMessage('Сохранено. Изменения уже на главной странице.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Концепция года" lead="Тексты, которые видны на главной странице сайта.">
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {!form && !loadError && <p className="empty-state">Загружаем…</p>}
      {form && (
        <form className="panel" onSubmit={save}>
          <label className="field-label">Учебный год
            <input className="field" value={form.year} onChange={set('year')} maxLength={20} />
          </label>
          <label className="field-label">Тема года
            <textarea className="field" value={form.theme} onChange={set('theme')} maxLength={600} required />
          </label>
          <label className="field-label">Цель года
            <textarea className="field" value={form.goal} onChange={set('goal')} maxLength={800} />
          </label>
          <label className="field-label">Основные задачи (каждая с новой строки)
            <textarea className="field" style={{ minHeight: 170 }} value={form.tasks} onChange={set('tasks')} />
          </label>
          <label className="field-label">Направления работы (по строке: «Название | Мероприятия»)
            <textarea className="field" style={{ minHeight: 130 }} value={form.directions} onChange={set('directions')} />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          {message && <p className="notice" role="status">{message}</p>}
          <div className="row-actions">
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
