import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { computeStats } from '@/lib/stats';
import { buildCourseImpact } from '@/lib/courseAssessments';
import { ADMIN_SESSION_COOKIE, adminCredentialsAreConfigured, hasValidAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;

// Supabase отдаёт максимум 1000 строк за запрос, поэтому читаем страницами.
async function fetchAllRows() {
  const supabase = getAdmin();
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchCourseAssessments() {
  const { data, error } = await getAdmin().from('course_assessments').select('learner_token, course_id, stage, score');
  if (error) throw error;
  return data;
}

export async function GET(request) {
  if (!adminCredentialsAreConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'На сервере не заданы ADMIN_EMAIL и ADMIN_PASSWORD' },
      { status: 500 }
    );
  }
  if (!hasValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Требуется вход администратора' }, { status: 401 });
  }

  try {
    const [rows, assessments] = await Promise.all([fetchAllRows(), fetchCourseAssessments()]);
    return NextResponse.json({
      ok: true,
      stats: computeStats(rows),
      courseImpact: buildCourseImpact(assessments),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Report error:', err);
    return NextResponse.json(
      { ok: false, error: 'Не удалось загрузить данные из базы' },
      { status: 500 }
    );
  }
}
