// Удаляет только фейковые ответы (is_test = true). Настоящие ответы не трогает.
// Запуск: npm run clear-test

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Заполни SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error, count } = await supabase
  .from('responses')
  .delete({ count: 'exact' })
  .eq('is_test', true);

if (error) {
  console.error('Ошибка удаления:', error.message);
  process.exit(1);
}

console.log(`Удалено тестовых ответов: ${count ?? 0}`);
