import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminCredentialsAreConfigured,
  createAdminSession,
  verifyCredentials,
} from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  if (!adminCredentialsAreConfigured()) {
    return NextResponse.json({ ok: false, error: 'На сервере не заданы ADMIN_EMAIL и ADMIN_PASSWORD' }, { status: 500 });
  }

  if (!verifyCredentials(body?.email, body?.password)) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return NextResponse.json({ ok: false, error: 'Неверная почта или пароль' }, { status: 401 });
  }

  const session = createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAge,
  });
  return response;
}
