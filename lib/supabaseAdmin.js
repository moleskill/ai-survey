import { createClient } from '@supabase/supabase-js';

let client;

// Серверный клиент с service_role ключом. Используется только в app/api/*,
// в браузер этот ключ не попадает.
export function getAdmin() {
  if (!client) {
    // SUPABASE_URL is the documented server-side setting. The fallback keeps
    // existing deployments that only defined the public project URL working.
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Не заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
