'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function GalleryView({ albums, failed }) {
  const [open, setOpen] = useState(null); // { a: индекс альбома, p: индекс фото }
  const [query, setQuery] = useState('');
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const isOpen = open !== null;

  const move = useCallback(
    (delta) =>
      setOpen((o) => {
        if (!o) return o;
        const n = albums[o.a].photos.length;
        return { a: o.a, p: (o.p + delta + n) % n };
      }),
    [albums]
  );

  // Пока фото открыто: стрелки и Esc, блокировка прокрутки страницы, возврат фокуса при закрытии.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      lastFocus.current?.focus?.();
    };
  }, [isOpen, move]);

  const visibleAlbums = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return albums;
    return albums.map((album) => ({ ...album, photos: album.photos.filter((photo) => `${album.title} ${album.meta || ''} ${photo.caption || ''}`.toLowerCase().includes(needle)) })).filter((album) => album.photos.length);
  }, [albums, query]);
  const album = open ? albums[open.a] : null;
  const photo = album ? album.photos[open.p] : null;
  const totalPhotos = albums.reduce((n, a) => n + a.photos.length, 0);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow rise" style={{ '--d': '0ms' }}>
          Фотогалерея
        </p>
        <h1 className="rise" style={{ '--d': '80ms' }}>
          Как это <mark>было</mark>
        </h1>
        <p className="lead rise" style={{ '--d': '160ms' }}>
          Фотографии с семинаров, классных часов, конкурсов и недели информатики.
          {totalPhotos > 0 && <span className="lead-count"> Всего фото: {totalPhotos}.</span>}
        </p>
        {albums.length > 0 && <label className="gallery-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти событие или подпись" aria-label="Поиск по фотогалерее" /></label>}
      </header>

      {albums.length === 0 && (
        <p className="empty-state">
          {failed ? 'Галерея ещё настраивается. Загляните сюда чуть позже.' : 'Фотографии пока не добавлены.'}
        </p>
      )}

      {query && visibleAlbums.length === 0 && <p className="empty-state">По этому запросу фотографий не найдено.</p>}

      {visibleAlbums.map((a, albumIndex) => (
        <section className="album" id={a.id === 'general' ? 'album-general' : `event-${a.id}`} key={a.id}>
          <div className="album-head">
            <span className="album-no">{String(albumIndex + 1).padStart(2, '0')}</span>
            <div>
              <h2>{a.title}</h2>
              {a.meta && <p className="muted">{a.meta}</p>}
            </div>
            <span className="album-count">{a.photos.length} фото</span>
          </div>
          <div className="photo-grid">
            {a.photos.map((p, photoIndex) => (
              <button
                type="button"
                className="photo"
                key={p.id}
                aria-label={p.caption ? `Открыть фото: ${p.caption}` : 'Открыть фото'}
                onClick={(e) => {
                  lastFocus.current = e.currentTarget;
                  const originalAlbumIndex = albums.findIndex((album) => album.id === a.id);
                  setOpen({ a: originalAlbumIndex, p: albums[originalAlbumIndex].photos.findIndex((photo) => photo.id === p.id) });
                }}
              >
                <img
                  src={p.url}
                  alt={p.caption || a.title}
                  loading="lazy"
                  width={p.width || undefined}
                  height={p.height || undefined}
                />
                {p.caption && <span className="photo-cap">{p.caption}</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {photo && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <button ref={closeRef} type="button" className="lb-btn lb-close" onClick={() => setOpen(null)} aria-label="Закрыть">
            ✕
          </button>
          {album.photos.length > 1 && (
            <>
              <button type="button" className="lb-btn lb-prev" onClick={() => move(-1)} aria-label="Предыдущее фото">
                ‹
              </button>
              <button type="button" className="lb-btn lb-next" onClick={() => move(1)} aria-label="Следующее фото">
                ›
              </button>
            </>
          )}
          <figure>
            <img src={photo.url} alt={photo.caption || album.title} />
            <figcaption>
              {photo.caption || album.title}
              <span className="lb-count">
                {open.p + 1} из {album.photos.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
