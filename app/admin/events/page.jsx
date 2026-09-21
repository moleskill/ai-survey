'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { adminFetch, jsonRequest } from '@/lib/adminFetch';
import { SECTIONS, STATUSES, statusLabel, whenLabel } from '@/lib/sections';

const EMPTY = {
  section: 'teachers',
  title: '',
  description: '',
  date_note: '',
  starts_on: '',
  grades: '',
  responsible: '',
  status: 'planned',
  is_published: true,
};

function EventForm({ initial, saving, error, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    onSave({ ...form, starts_on: form.starts_on || null });
  }

  return (
    <form className="panel" onSubmit={submit} aria-label="Форма мероприятия">
      <h2>{initial.id ? 'Редактирование мероприятия' : 'Новое мероприятие'}</h2>
      <div className="form-grid">
        <label className="field-label">Раздел
          <select className="field" value={form.section} onChange={set('section')}>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>
        <label className="field-label">Статус
          <select className="field" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="field-label wide">Название
          <input className="field" value={form.title} onChange={set('title')} maxLength={300} required />
        </label>
        <label className="field-label wide">Описание (необязательно)
          <textarea className="field" value={form.description || ''} onChange={set('description')} maxLength={2000} />
        </label>
        <label className="field-label">Когда (текстом)
          <input className="field" value={form.date_note || ''} onChange={set('date_note')} maxLength={100} placeholder="например, 12–17 октября" />
        </label>
        <label className="field-label">Дата начала
          <input className="field" type="date" value={form.starts_on || ''} onChange={set('starts_on')} />
        </label>
        <label className="field-label">Классы
          <input className="field" value={form.grades || ''} onChange={set('grades')} maxLength={60} placeholder="например, 9 класс" />
        </label>
        <label className="field-label">Ответственный
          <input className="field" value={form.responsible || ''} onChange={set('responsible')} maxLength={120} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
        Показывать на сайте
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-actions">
        <button type="submit" className="btn" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Отмена</button>
      </div>
    </form>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null | объект формы
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/events');
      setEvents(data.events);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing]);

  function startNew(section) {
    setFormError('');
    setEditing({ ...EMPTY, section: section || EMPTY.section });
  }

  async function save(values) {
    setSaving(true);
    setFormError('');
    try {
      let done;
      if (editing.id) {
        const { id } = editing;
        await adminFetch('/api/admin/events', jsonRequest('PATCH', { ...values, id }));
        done = 'Мероприятие обновлено';
      } else {
        await adminFetch('/api/admin/events', jsonRequest('POST', values));
        done = 'Мероприятие добавлено';
      }
      setEditing(null);
      await load();
      setMessage(done);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function quick(event, patch, done) {
    try {
      await adminFetch('/api/admin/events', jsonRequest('PATCH', { id: event.id, ...patch }));
      await load();
      setMessage(done);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function remove(event) {
    if (!window.confirm(`Удалить «${event.title}»? Фото этого мероприятия останутся в галерее как общие.`)) return;
    try {
      await adminFetch('/api/admin/events', jsonRequest('DELETE', { id: event.id }));
      await load();
      setMessage('Мероприятие удалено');
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <AdminShell title="Мероприятия" lead="План года: добавляйте даты, отмечайте проведённые мероприятия, скрывайте лишнее.">
      <div className="row-actions" style={{ marginBottom: 18 }}>
        <button type="button" className="btn" onClick={() => startNew()}>Добавить мероприятие</button>
      </div>

      {message && <p className="notice" role="status">{message}</p>}
      {loadError && <p className="error" role="alert">{loadError}</p>}

      <div ref={formRef}>
        {editing && (
          <EventForm
            key={editing.id || 'new'}
            initial={editing}
            saving={saving}
            error={formError}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>

      {events === null && !loadError && <p className="empty-state">Загружаем…</p>}

      {events && SECTIONS.map((section) => {
        const items = events.filter((e) => e.section === section.id);
        return (
          <section className="panel" key={section.id} aria-labelledby={`h-${section.id}`}>
            <h2 id={`h-${section.id}`}>{section.title} <span className="muted">({items.length})</span></h2>
            {items.length === 0 && <p className="muted">Пока пусто.</p>}
            <ul className="admin-list">
              {items.map((event) => (
                <li className="admin-item" key={event.id}>
                  <div>
                    <h3>{event.title}</h3>
                    <div className="meta">
                      <span className={`pill ${event.status}`}>{statusLabel(event.status)}</span>
                      {whenLabel(event) && <span>{whenLabel(event)}</span>}
                      {event.grades && <span>{event.grades}</span>}
                      {event.responsible && <span>{event.responsible}</span>}
                      {!event.is_published && <span className="pill hidden">Скрыто</span>}
                    </div>
                  </div>
                  <div className="row-actions">
                    {event.status !== 'done' ? (
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => quick(event, { status: 'done' }, 'Отмечено как проведённое')}>Проведено</button>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => quick(event, { status: 'planned' }, 'Возвращено в план')}>В план</button>
                    )}
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => { setFormError(''); setEditing({ ...event }); }}>Изменить</button>
                    <button type="button" className="btn btn-ghost btn-small btn-danger" onClick={() => remove(event)}>Удалить</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => startNew(section.id)}>Добавить в этот раздел</button>
            </div>
          </section>
        );
      })}
    </AdminShell>
  );
}
