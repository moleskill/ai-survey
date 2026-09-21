-- Таблица ответов анонимного опроса "ИИ среди школьников"
-- Запусти в Supabase: SQL Editor -> New query -> вставить -> Run

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- true у фейковых ответов из `npm run seed`, чтобы потом их удалить (`npm run clear-test`)
  is_test boolean not null default false,

  -- случайный токен браузера, нужен только против повторной отправки (личность не хранит)
  submission_token uuid not null unique,

  -- Блок 1. О респонденте
  q1_grade smallint not null check (q1_grade between 7 and 11),
  q2_knows_ai_day text not null check (q2_knows_ai_day in ('yes', 'partly', 'no')),
  q3_digitalization text not null check (q3_digitalization in ('positive', 'neutral', 'negative', 'unknown')),

  -- Блок 2. Использование ИИ (q5-q14 остаются NULL, если q4 = 'never')
  q4_uses_ai text not null check (q4_uses_ai in ('regularly', 'sometimes', 'tried', 'never')),
  q5_start_year text check (q5_start_year in ('2022_or_earlier', '2023', '2024', '2025', '2026')),
  q6_services text[],
  q7_frequency text check (q7_frequency in ('daily', 'several_week', 'weekly', 'rarely')),
  q8_daily_time text check (q8_daily_time in ('lt15', '15_30', '30_60', 'gt60')),
  q9_language text check (q9_language in ('ru', 'en', 'tg', 'mixed')),
  q10_purposes text[],
  q11_subjects text[],
  q12_paid boolean,

  -- Блок 3. Отношение к ИИ (q13-q14 только для пользователей, остальные для всех)
  q13_trust smallint check (q13_trust between 1 and 5),
  q14_verifies text check (q14_verifies in ('always', 'sometimes', 'rarely')),
  q15_impact text not null check (q15_impact in ('helps', 'rather_helps', 'none', 'rather_hurts', 'hurts')),
  q16_school_policy text not null check (q16_school_policy in ('free', 'limited', 'no')),
  q17_taught text not null check (q17_taught in ('yes', 'partly', 'no')),
  q18_wants_course text not null check (q18_wants_course in ('yes', 'no', 'unknown')),
  q19_concerns text[] not null,
  q20_career text not null check (q20_career in ('yes', 'maybe', 'no', 'unknown'))
);

-- Закрываем таблицу от прямого доступа из браузера:
-- политик нет, поэтому читать и писать может только сервер (service_role ключ в Next.js API)
alter table public.responses enable row level security;

-- Анонимные результаты тестов до и после каждого курса MoleSkill.
-- learner_token — случайный UUID, хранимый только в браузере ученика; имён,
-- контактов и IP-адресов таблица не содержит.
create table if not exists public.course_assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  learner_token uuid not null,
  course_id text not null check (course_id in ('ai-start', 'prompts', 'safe-ai')),
  stage text not null check (stage in ('before', 'after')),
  score smallint not null check (score between 0 and 5),
  answers jsonb not null,
  unique (learner_token, course_id, stage)
);

alter table public.course_assessments enable row level security;
