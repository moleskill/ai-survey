import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { validateSubmission } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  try {
    const { error } = await getAdmin().from('responses').insert(result.row);

    if (error) {
      // 23505 = нарушение уникальности submission_token: этот ответ уже сохранён
      // (например, дважды нажали «Отправить»). Для ученика это успех.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { ok: false, error: 'Не удалось сохранить ответы. Попробуйте ещё раз.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json(
      { ok: false, error: 'Сервер временно недоступен. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
