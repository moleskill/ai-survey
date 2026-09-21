import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getEvents } from '@/lib/content';
import { sanitizeEvent, UUID_RE } from '@/lib/validateContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status });
const dbError = (error, fallback) => {
  console.error(fallback, error);
  return json({ ok: false, error: fallback }, 500);
};
const SETUP_HINT = 'Не удалось прочитать таблицы. Запущен ли supabase/02-school-site.sql?';

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Все мероприятия, включая скрытые.
export async function GET(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { events, error } = await getEvents({ includeHidden: true });
  if (error) return dbError(error, SETUP_HINT);
  return json({ ok: true, events });
}

export async function POST(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  const result = sanitizeEvent(body);
  if (!result.ok) return json({ ok: false, error: result.error }, 400);

  const supabase = getAdmin();

  // Новое мероприятие встаёт в конец списка.
  const { data: last, error: lastError } = await supabase
    .from('events')
    .select('*')
    .order('sort_order', { ascending: false })
    .range(0, 0);
  if (lastError) return dbError(lastError, SETUP_HINT);
  const nextOrder = (last && last[0] ? last[0].sort_order : 0) + 10;

  const { data, error } = await supabase
    .from('events')
    .insert({ ...result.value, sort_order: nextOrder })
    .select()
    .single();
  if (error) return dbError(error, 'Не удалось сохранить мероприятие');
  return json({ ok: true, event: data });
}

export async function PATCH(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  if (!body || typeof body.id !== 'string' || !UUID_RE.test(body.id)) {
    return json({ ok: false, error: 'Не указано мероприятие' }, 400);
  }
  const { id, ...fields } = body;
  const result = sanitizeEvent(fields, { partial: true });
  if (!result.ok) return json({ ok: false, error: result.error }, 400);
  if (Object.keys(result.value).length === 0) return json({ ok: false, error: 'Нечего менять' }, 400);

  const { data, error } = await getAdmin()
    .from('events')
    .update({ ...result.value, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return dbError(error, 'Не удалось обновить мероприятие');
  return json({ ok: true, event: data });
}

export async function DELETE(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  if (!body || typeof body.id !== 'string' || !UUID_RE.test(body.id)) {
    return json({ ok: false, error: 'Не указано мероприятие' }, 400);
  }
  // Фото удалённого мероприятия остаются в галерее как «Общие фото» (on delete set null).
  const { error } = await getAdmin().from('events').delete().eq('id', body.id);
  if (error) return dbError(error, 'Не удалось удалить мероприятие');
  return json({ ok: true });
}
