import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { validateAssessment } from '@/lib/courseAssessments';

export const runtime = 'nodejs';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Некорректный запрос.' }, { status: 400 }); }
  const result = validateAssessment(body);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  try {
    const { error } = await getAdmin().from('course_assessments').upsert(result.row, { onConflict: 'learner_token,course_id,stage' });
    if (error) throw error;
    return NextResponse.json({ ok: true, score: result.row.score, total: 5 });
  } catch (error) {
    console.error('Course assessment error:', error);
    return NextResponse.json({ ok: false, error: 'Не удалось сохранить результат. Попробуйте ещё раз.' }, { status: 500 });
  }
}
