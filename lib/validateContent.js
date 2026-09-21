import { SECTIONS, STATUSES } from './sections';

const fail = (error) => ({ ok: false, error });
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Пустая строка превращается в null; длина ограничивается max.
function text(value, max, label) {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== 'string') return fail(`Поле «${label}» должно быть текстом`);
  const trimmed = value.trim();
  if (trimmed.length > max) return fail(`Поле «${label}» длиннее ${max} символов`);
  return { ok: true, value: trimmed === '' ? null : trimmed };
}

function isRealDate(iso) {
  if (!DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// partial = true: проверяем только те поля, что пришли (для PATCH).
export function sanitizeEvent(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Некорректные данные');
  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
  const out = {};

  if (!partial || has('section')) {
    if (!SECTIONS.some((s) => s.id === input.section)) return fail('Выберите раздел');
    out.section = input.section;
  }

  if (!partial || has('title')) {
    const t = text(input.title, 300, 'Название');
    if (!t.ok) return t;
    if (!t.value || t.value.length < 3) return fail('Название должно быть не короче 3 символов');
    out.title = t.value;
  }

  const optional = [
    ['description', 2000, 'Описание'],
    ['date_note', 100, 'Когда'],
    ['grades', 60, 'Классы'],
    ['responsible', 120, 'Ответственный'],
  ];
  for (const [key, max, label] of optional) {
    if (has(key)) {
      const t = text(input[key], max, label);
      if (!t.ok) return t;
      out[key] = t.value;
    } else if (!partial) {
      out[key] = null;
    }
  }

  if (has('starts_on')) {
    const v = input.starts_on;
    if (v === null || v === '') out.starts_on = null;
    else if (typeof v === 'string' && isRealDate(v)) out.starts_on = v;
    else return fail('Дата указана неверно');
  } else if (!partial) {
    out.starts_on = null;
  }

  if (has('status')) {
    if (!STATUSES.some((s) => s.id === input.status)) return fail('Неизвестный статус');
    out.status = input.status;
  } else if (!partial) {
    out.status = 'planned';
  }

  if (has('is_published')) {
    if (typeof input.is_published !== 'boolean') return fail('Некорректное значение видимости');
    out.is_published = input.is_published;
  } else if (!partial) {
    out.is_published = true;
  }

  return { ok: true, value: out };
}

export function sanitizeConcept(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Некорректные данные');

  const year = text(input.year, 20, 'Учебный год');
  if (!year.ok) return year;
  const theme = text(input.theme, 600, 'Тема года');
  if (!theme.ok) return theme;
  if (!theme.value) return fail('Укажите тему года');
  const goal = text(input.goal, 800, 'Цель года');
  if (!goal.ok) return goal;

  if (!Array.isArray(input.tasks) || input.tasks.length > 20) return fail('Задач должно быть не больше 20');
  const tasks = [];
  for (const raw of input.tasks) {
    const t = text(raw, 300, 'Задача');
    if (!t.ok) return t;
    if (t.value) tasks.push(t.value);
  }

  if (!Array.isArray(input.directions) || input.directions.length > 12) {
    return fail('Направлений должно быть не больше 12');
  }
  const directions = [];
  for (const raw of input.directions) {
    if (!raw || typeof raw !== 'object') return fail('Некорректное направление');
    const name = text(raw.name, 120, 'Название направления');
    if (!name.ok) return name;
    const activities = text(raw.activities, 400, 'Мероприятия направления');
    if (!activities.ok) return activities;
    if (name.value) directions.push({ name: name.value, activities: activities.value || '' });
  }

  return {
    ok: true,
    value: { year: year.value || '', theme: theme.value, goal: goal.value || '', tasks, directions },
  };
}

export function sanitizePhotoMeta(input) {
  const out = {};
  if (Object.prototype.hasOwnProperty.call(input, 'caption')) {
    const c = text(input.caption, 300, 'Подпись');
    if (!c.ok) return c;
    out.caption = c.value;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'event_id')) {
    const v = input.event_id;
    if (v === null || v === '' || v === 'general') out.event_id = null;
    else if (typeof v === 'string' && UUID_RE.test(v)) out.event_id = v;
    else return fail('Некорректный альбом');
  }
  return { ok: true, value: out };
}
