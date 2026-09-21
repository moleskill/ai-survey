// Разделы плана и статусы мероприятий. Значения совпадают с CHECK в supabase/02-school-site.sql.

export const SECTIONS = [
  { id: 'teachers', title: 'Семинары для учителей', short: 'Учителям' },
  { id: 'students', title: 'Семинары и тренинги для учащихся', short: 'Учащимся' },
  { id: 'educational', title: 'Воспитательные мероприятия', short: 'Воспитательные' },
  { id: 'contests', title: 'Викторины, КВН и конкурсы', short: 'Конкурсы' },
  { id: 'methodical', title: 'Методические мероприятия', short: 'Методические' },
];

export const STATUSES = [
  { id: 'planned', label: 'Запланировано' },
  { id: 'done', label: 'Проведено' },
  { id: 'cancelled', label: 'Отменено' },
];

export const sectionTitle = (id) => SECTIONS.find((s) => s.id === id)?.title ?? id;
export const sectionShort = (id) => SECTIONS.find((s) => s.id === id)?.short ?? id;
export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id;

// Порядок в разделе: сначала мероприятия с датой (по возрастанию), затем без даты по порядку добавления.
export function compareEvents(a, b) {
  const sa = SECTIONS.findIndex((s) => s.id === a.section);
  const sb = SECTIONS.findIndex((s) => s.id === b.section);
  if (sa !== sb) return sa - sb;
  const da = a.starts_on ? 0 : 1;
  const db = b.starts_on ? 0 : 1;
  if (da !== db) return da - db;
  if (a.starts_on && b.starts_on && a.starts_on !== b.starts_on) return a.starts_on < b.starts_on ? -1 : 1;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return String(a.created_at).localeCompare(String(b.created_at));
}

// «2026-10-12» -> «12 октября 2026 г.»
export function formatDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Что показывать в поле «когда»: свободный текст или отформатированная дата.
export function whenLabel(event) {
  return event.date_note || formatDate(event.starts_on) || '';
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

// «2026-10-14» -> { day: 14, month: 'окт', year: 2026 } для плитки-календаря
export function dateParts(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return { day, month: MONTHS_SHORT[month - 1], year };
}
