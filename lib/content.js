import { getAdmin } from './supabaseAdmin';
import { compareEvents } from './sections';

// Чтение контента сайта на сервере. Используется публичными страницами и админскими API.
// Все функции возвращают { ..., error }: если таблицы ещё не созданы (не запущен 02-school-site.sql),
// страницы показывают пустое состояние вместо падения.

export const GALLERY_BUCKET = 'gallery';

export const DEFAULT_CONCEPT = {
  year: '2026–2027',
  theme:
    'Внедрение технологий искусственного интеллекта (ИИ) в образовательный процесс через компетентностный подход как средство повышения качества образования',
  goal: '',
  tasks: [],
  directions: [],
};

export function publicPhotoUrl(path) {
  return getAdmin().storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function getConcept() {
  const { data, error } = await getAdmin().from('site_content').select('*').eq('key', 'concept');
  if (error) return { concept: { ...DEFAULT_CONCEPT }, error };
  const row = data && data[0];
  return { concept: row ? { ...DEFAULT_CONCEPT, ...row.value } : { ...DEFAULT_CONCEPT } };
}

export async function getEvents({ includeHidden = false } = {}) {
  let query = getAdmin().from('events').select('*');
  if (!includeHidden) query = query.eq('is_published', true);
  const { data, error } = await query;
  if (error) return { events: [], error };
  return { events: [...data].sort(compareEvents) };
}

export async function getPhotos() {
  const { data, error } = await getAdmin()
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { photos: [], error };
  return { photos: data.map((p) => ({ ...p, url: publicPhotoUrl(p.path) })) };
}

// Всё, что нужно публичным страницам, одним вызовом.
export async function loadSite() {
  let c;
  let e;
  let p;
  try {
    [c, e, p] = await Promise.all([getConcept(), getEvents(), getPhotos()]);
  } catch (err) {
    // например, не заданы переменные окружения Supabase
    console.error('Site content error:', err);
    return { concept: { ...DEFAULT_CONCEPT }, events: [], photos: [], failed: true };
  }
  const error = c.error || e.error || p.error || null;
  if (error) console.error('Site content error:', error.message || error);

  // Фото скрытых мероприятий не показываем; фото без мероприятия показываем всегда.
  const visible = new Set(e.events.map((ev) => ev.id));
  const photos = p.photos
    .filter((ph) => !ph.event_id || visible.has(ph.event_id))
    .map(({ id, url, width, height, caption, event_id, created_at }) => ({
      id,
      url,
      width,
      height,
      caption,
      event_id,
      created_at,
    }));

  return { concept: c.concept, events: e.events, photos, failed: Boolean(error) };
}

// Сегодняшняя дата в Душанбе (YYYY-MM-DD), чтобы «ближайшие» не зависели от часового пояса сервера.
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dushanbe' }).format(new Date());
}
