'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { adminFetch, jsonRequest } from '@/lib/adminFetch';
import { compressImage } from '@/lib/imageCompress';
import { SECTIONS, whenLabel } from '@/lib/sections';

// Выпадающий список альбомов: «Общие фото» + мероприятия, сгруппированные по разделам.
function AlbumSelect({ value, events, onChange, id, className = 'field' }) {
  return (
    <select id={id} className={className} value={value || 'general'} onChange={(e) => onChange(e.target.value)}>
      <option value="general">Общие фото (без мероприятия)</option>
      {SECTIONS.map((section) => {
        const items = events.filter((e) => e.section === section.id);
        if (!items.length) return null;
        return (
          <optgroup key={section.id} label={section.title}>
            {items.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title.length > 70 ? `${e.title.slice(0, 70)}…` : e.title}
                {whenLabel(e) ? ` (${whenLabel(e)})` : ''}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

function PhotoTile({ photo, events, onChanged, onDeleted, onError }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [busy, setBusy] = useState(false);
  const dirty = caption.trim() !== (photo.caption || '');

  async function patch(body) {
    setBusy(true);
    try {
      await adminFetch('/api/admin/photos', jsonRequest('PATCH', { id: photo.id, ...body }));
      await onChanged();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Удалить это фото?')) return;
    setBusy(true);
    try {
      await adminFetch('/api/admin/photos', jsonRequest('DELETE', { id: photo.id }));
      await onDeleted();
    } catch (e) {
      onError(e.message);
      setBusy(false);
    }
  }

  return (
    <li className="admin-photo">
      <img src={photo.url} alt={photo.caption || 'Фото'} loading="lazy" />
      <div className="admin-photo-body">
        <input
          className="field"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={300}
          placeholder="Подпись"
          aria-label="Подпись к фото"
        />
        {dirty && (
          <button type="button" className="btn btn-small" disabled={busy} onClick={() => patch({ caption })}>
            Сохранить подпись
          </button>
        )}
        <AlbumSelect
          value={photo.event_id}
          events={events}
          onChange={(v) => patch({ event_id: v })}
        />
        <button type="button" className="btn btn-ghost btn-small btn-danger" disabled={busy} onClick={remove}>
          Удалить фото
        </button>
      </div>
    </li>
  );
}

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [album, setAlbum] = useState('general');
  const [caption, setCaption] = useState('');
  const [uploads, setUploads] = useState([]); // [{ id, name, status: wait|work|done|fail, error }]
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/photos');
      setPhotos(data.photos);
      setEvents(data.events);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e) {
    e.preventDefault();
    const files = Array.from(fileInput.current?.files || []);
    if (!files.length || uploading) return;

    setUploading(true);
    setMessage('');
    const queue = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, status: 'wait', error: '' }));
    setUploads(queue);
    const update = (id, patch) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));

    let ok = 0;
    for (let i = 0; i < files.length; i += 1) {
      const item = queue[i];
      update(item.id, { status: 'work' });
      try {
        const { blob, width, height } = await compressImage(files[i]);
        const form = new FormData();
        form.append('file', blob, `photo-${i}.jpg`);
        form.append('eventId', album === 'general' ? '' : album);
        form.append('caption', caption);
        form.append('width', String(width));
        form.append('height', String(height));
        await adminFetch('/api/admin/photos', { method: 'POST', body: form });
        update(item.id, { status: 'done' });
        ok += 1;
      } catch (err) {
        update(item.id, { status: 'fail', error: err.message });
      }
    }

    if (fileInput.current) fileInput.current.value = '';
    setUploading(false);
    await load();
    setMessage(ok === files.length ? `Загружено фото: ${ok}` : `Загружено ${ok} из ${files.length}. Ошибки отмечены в списке.`);
  }

  const STATUS_TEXT = { wait: 'В очереди', work: 'Загружаем…', done: 'Готово', fail: 'Ошибка' };

  return (
    <AdminShell title="Фотографии" lead="Выберите мероприятие и загрузите фото. Перед отправкой они автоматически уменьшаются.">
      {loadError && <p className="error" role="alert">{loadError}</p>}

      <form className="panel" onSubmit={upload} aria-label="Загрузка фото">
        <h2>Загрузить фото</h2>
        <label className="field-label">Альбом (мероприятие)
          <AlbumSelect value={album} events={events} onChange={setAlbum} />
        </label>
        <label className="field-label">Подпись ко всем выбранным фото (необязательно)
          <input className="field" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
        </label>
        <label className="field-label">Фотографии
          <input ref={fileInput} className="field" type="file" accept="image/*" multiple required />
        </label>
        <div className="row-actions">
          <button type="submit" className="btn" disabled={uploading}>{uploading ? 'Загружаем…' : 'Загрузить'}</button>
        </div>

        {uploads.length > 0 && (
          <ul className="upload-list" aria-live="polite">
            {uploads.map((u) => (
              <li key={u.id} className={`upload ${u.status}`}>
                <span className="upload-name">{u.name}</span>
                <span>{u.status === 'fail' ? u.error : STATUS_TEXT[u.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      {message && <p className="notice" role="status">{message}</p>}

      {photos === null && !loadError && <p className="empty-state">Загружаем…</p>}
      {photos && photos.length === 0 && <p className="empty-state">Фотографий пока нет.</p>}
      {photos && photos.length > 0 && (
        <section aria-labelledby="all-photos">
          <h2 id="all-photos" className="admin-subtitle">Все фото ({photos.length})</h2>
          <ul className="admin-photos">
            {photos.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                events={events}
                onChanged={load}
                onDeleted={async () => {
                  await load();
                  setMessage('Фото удалено');
                }}
                onError={setMessage}
              />
            ))}
          </ul>
        </section>
      )}
    </AdminShell>
  );
}
