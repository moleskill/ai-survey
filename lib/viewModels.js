import { SECTIONS, sectionTitle, whenLabel } from './sections';

// Чистые функции, которые превращают строки из базы в данные для страниц.

// План: разделы -> мероприятия, у каждого число фото.
export function buildPlan(events, photos) {
  const photoCount = {};
  for (const p of photos) {
    if (p.event_id) photoCount[p.event_id] = (photoCount[p.event_id] || 0) + 1;
  }
  return SECTIONS.map((section) => {
    const items = events
      .filter((e) => e.section === section.id)
      .map((e) => ({ ...e, photoCount: photoCount[e.id] || 0 }));
    const done = items.filter((e) => e.status === 'done').length;
    const active = items.filter((e) => e.status !== 'cancelled').length;
    return { ...section, events: items, done, active };
  });
}

// Галерея: «Общие фото» + по альбому на каждое мероприятие, у которого есть фото.
export function buildAlbums(events, photos) {
  const albums = [];
  const general = photos.filter((p) => !p.event_id);
  if (general.length) {
    albums.push({ id: 'general', title: 'Общие фото', meta: '', photos: general });
  }
  for (const event of events) {
    const own = photos.filter((p) => p.event_id === event.id);
    if (!own.length) continue;
    const when = whenLabel(event);
    albums.push({
      id: event.id,
      title: event.title,
      meta: [sectionTitle(event.section), when].filter(Boolean).join(', '),
      photos: own,
    });
  }
  return albums;
}

// Ближайшие мероприятия: с датой не раньше сегодняшней и не отменённые.
export function upcomingEvents(events, today, limit = 4) {
  return events
    .filter((e) => e.starts_on && e.starts_on >= today && e.status === 'planned')
    .sort((a, b) => (a.starts_on < b.starts_on ? -1 : a.starts_on > b.starts_on ? 1 : 0))
    .slice(0, limit);
}
