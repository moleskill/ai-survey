// Заливает в базу фейковые ответы, чтобы посмотреть, как выглядит отчёт.
// Запуск: npm run seed        (150 ответов)
//         npm run seed -- 300 (300 ответов)
// Удалить фейковые ответы: npm run clear-test

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const count = Number(process.argv[2] || 150);
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Заполни SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// weighted([[значение, вес], ...]) выбирает значение с учётом весов
function weighted(pairs) {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

// subset([[значение, вероятность], ...]) выбирает несколько значений, минимум одно
function subset(pairs) {
  const out = pairs.filter(([, p]) => Math.random() < p).map(([v]) => v);
  return out.length ? out : [weighted(pairs)];
}

function fakeRow() {
  const uses = weighted([['regularly', 50], ['sometimes', 30], ['tried', 12], ['never', 8]]);
  const user = uses !== 'never';

  return {
    submission_token: randomUUID(),
    is_test: true,

    q1_grade: weighted([[7, 20], [8, 20], [9, 22], [10, 20], [11, 18]]),
    q2_knows_ai_day: weighted([['yes', 35], ['partly', 40], ['no', 25]]),
    q3_digitalization: weighted([['positive', 55], ['neutral', 30], ['negative', 5], ['unknown', 10]]),
    q4_uses_ai: uses,

    q5_start_year: user ? weighted([['2022_or_earlier', 6], ['2023', 20], ['2024', 34], ['2025', 32], ['2026', 8]]) : null,
    q6_services: user
      ? subset([['chatgpt', 0.75], ['claude', 0.25], ['gemini', 0.4], ['deepseek', 0.3], ['copilot', 0.15], ['alice', 0.2], ['other', 0.08]])
      : null,
    q7_frequency: user ? weighted([['daily', 35], ['several_week', 35], ['weekly', 18], ['rarely', 12]]) : null,
    q8_daily_time: user ? weighted([['lt15', 30], ['15_30', 34], ['30_60', 24], ['gt60', 12]]) : null,
    q9_language: user ? weighted([['ru', 55], ['en', 25], ['tg', 5], ['mixed', 15]]) : null,
    q10_purposes: user
      ? subset([['homework', 0.7], ['explain', 0.55], ['coding', 0.3], ['translate', 0.4], ['creative', 0.25], ['search', 0.5], ['fun', 0.3]])
      : null,
    q11_subjects: user
      ? subset([['math', 0.55], ['physics', 0.35], ['cs', 0.4], ['russian', 0.3], ['english', 0.4], ['natural', 0.25], ['other', 0.1]])
      : null,
    q12_paid: user ? Math.random() < 0.12 : null,

    q13_trust: user ? weighted([[1, 4], [2, 12], [3, 38], [4, 34], [5, 12]]) : null,
    q14_verifies: user ? weighted([['always', 22], ['sometimes', 53], ['rarely', 25]]) : null,
    q15_impact: weighted([['helps', 38], ['rather_helps', 34], ['none', 16], ['rather_hurts', 9], ['hurts', 3]]),
    q16_school_policy: weighted([['free', 22], ['limited', 60], ['no', 18]]),
    q17_taught: weighted([['yes', 15], ['partly', 32], ['no', 53]]),
    q18_wants_course: weighted([['yes', 58], ['no', 17], ['unknown', 25]]),
    q19_concerns: weighted([[true, 85], [false, 15]])
      ? subset([['cheating', 0.5], ['dependence', 0.45], ['mistakes', 0.4], ['privacy', 0.25], ['jobs', 0.35]])
      : ['none'],
    q20_career: weighted([['yes', 32], ['maybe', 34], ['no', 16], ['unknown', 18]]),
  };
}

const rows = Array.from({ length: count }, fakeRow);

for (let i = 0; i < rows.length; i += 100) {
  const chunk = rows.slice(i, i + 100);
  const { error } = await supabase.from('responses').insert(chunk);
  if (error) {
    console.error('Ошибка вставки:', error.message);
    process.exit(1);
  }
}

console.log(`Готово: добавлено ${rows.length} тестовых ответов. Удалить: npm run clear-test`);
