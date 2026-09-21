import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Проверка «я уже вошёл?» для страниц админки.
export async function GET(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true });
}
