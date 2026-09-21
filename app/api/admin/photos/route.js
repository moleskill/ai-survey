import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { getAdmin } from '@/lib/supabaseAdmin';
import { GALLERY_BUCKET, getEvents, getPhotos } from '@/lib/content';
import { sanitizePhotoMeta, UUID_RE } from '@/lib/validateContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Браузер сжимает фото до ~1800 px перед загрузкой, так что файл обычно меньше 1 МБ.
// Лимит 4 МБ держим ниже ограничения Vercel на размер запроса (4,5 МБ).
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const json = (body, status = 200) => NextResponse.json(body, { status });
const clampInt = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 20000 ? n : null;
};

// Список фото и список альбомов (мероприятий) для выпадающих списков.
export async function GET(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const [p, e] = await Promise.all([getPhotos(), getEvents({ includeHidden: true })]);
  if (p.error || e.error) {
    console.error('Photos read error:', p.error || e.error);
    return json({ ok: false, error: 'Не удалось прочитать таблицы. Запущен ли supabase/02-school-site.sql?' }, 500);
  }
  return json({
    ok: true,
    photos: p.photos,
    events: e.events.map(({ id, title, section, starts_on, date_note }) => ({
      id,
      title,
      section,
      starts_on,
      date_note,
    })),
  });
}

// Загрузка одной фотографии (multipart: file, eventId, caption, width, height).
export async function POST(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Не удалось прочитать файл' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return json({ ok: false, error: 'Файл не выбран' }, 400);
  }
  const ext = TYPES[file.type];
  if (!ext) return json({ ok: false, error: 'Подходят только JPG, PNG и WebP' }, 400);
  if (file.size > MAX_BYTES) {
    return json({ ok: false, error: 'Файл больше 4 МБ. Выберите фото поменьше.' }, 413);
  }

  const meta = sanitizePhotoMeta({
    event_id: form.get('eventId') || null,
    caption: typeof form.get('caption') === 'string' ? form.get('caption') : null,
  });
  if (!meta.ok) return json({ ok: false, error: meta.error }, 400);

  const folder = meta.value.event_id || 'general';
  const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const supabase = getAdmin();

  const { error: uploadError } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
    });
  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return json({ ok: false, error: 'Не удалось загрузить фото в хранилище. Создан ли bucket gallery?' }, 500);
  }

  const { data, error } = await supabase
    .from('photos')
    .insert({
      path,
      event_id: meta.value.event_id,
      caption: meta.value.caption ?? null,
      width: clampInt(form.get('width')),
      height: clampInt(form.get('height')),
    })
    .select()
    .single();
  if (error) {
    console.error('Photo insert error:', error);
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    return json({ ok: false, error: 'Не удалось сохранить фото' }, 500);
  }
  return json({ ok: true, photo: data });
}

// Смена подписи или альбома.
export async function PATCH(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Некорректный запрос' }, 400);
  }
  if (!body || typeof body.id !== 'string' || !UUID_RE.test(body.id)) {
    return json({ ok: false, error: 'Не указано фото' }, 400);
  }
  const meta = sanitizePhotoMeta(body);
  if (!meta.ok) return json({ ok: false, error: meta.error }, 400);
  if (Object.keys(meta.value).length === 0) return json({ ok: false, error: 'Нечего менять' }, 400);

  const { data, error } = await getAdmin()
    .from('photos')
    .update(meta.value)
    .eq('id', body.id)
    .select()
    .single();
  if (error) {
    console.error('Photo update error:', error);
    return json({ ok: false, error: 'Не удалось обновить фото' }, 500);
  }
  return json({ ok: true, photo: data });
}

export async function DELETE(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Некорректный запрос' }, 400);
  }
  if (!body || typeof body.id !== 'string' || !UUID_RE.test(body.id)) {
    return json({ ok: false, error: 'Не указано фото' }, 400);
  }

  const supabase = getAdmin();
  const { data: rows, error: readError } = await supabase.from('photos').select('*').eq('id', body.id);
  if (readError) {
    console.error('Photo read error:', readError);
    return json({ ok: false, error: 'Не удалось найти фото' }, 500);
  }
  const photo = rows && rows[0];
  if (!photo) return json({ ok: false, error: 'Фото уже удалено' }, 404);

  const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove([photo.path]);
  if (removeError) console.error('Storage remove error:', removeError); // строку всё равно удаляем

  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) {
    console.error('Photo delete error:', error);
    return json({ ok: false, error: 'Не удалось удалить фото' }, 500);
  }
  return json({ ok: true });
}
