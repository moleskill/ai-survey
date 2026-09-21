import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getConcept } from '@/lib/content';
import { sanitizeConcept } from '@/lib/validateContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status });

export async function GET(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { concept, error } = await getConcept();
  if (error) {
    console.error('Concept read error:', error);
    return json({ ok: false, error: 'Не удалось прочитать таблицы. Запущен ли supabase/02-school-site.sql?' }, 500);
  }
  return json({ ok: true, concept });
}

export async function PUT(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Некорректный запрос' }, 400);
  }

  const result = sanitizeConcept(body?.concept);
  if (!result.ok) return json({ ok: false, error: result.error }, 400);

  const { error } = await getAdmin()
    .from('site_content')
    .upsert({ key: 'concept', value: result.value, updated_at: new Date().toISOString() });
  if (error) {
    console.error('Concept save error:', error);
    return json({ ok: false, error: 'Не удалось сохранить концепцию' }, 500);
  }
  return json({ ok: true, concept: result.value });
}
