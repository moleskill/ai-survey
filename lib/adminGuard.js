import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminCredentialsAreConfigured, hasValidAdminSession } from './adminAuth';

// Возвращает готовый ответ с ошибкой, если запрос не от администратора, иначе null.
export function requireAdmin(request) {
  if (!adminCredentialsAreConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'На сервере не заданы ADMIN_EMAIL и ADMIN_PASSWORD' },
      { status: 500 }
    );
  }
  if (!hasValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Требуется вход администратора' }, { status: 401 });
  }
  return null;
}
