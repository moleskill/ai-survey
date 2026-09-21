-- Часть 2: школьный сайт (концепция года, план мероприятий, фотогалерея).
-- Запусти в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Скрипт можно запускать повторно: таблицы не пересоздаются, а стартовый план
-- и концепция добавляются только если таблицы пусты.
-- Таблица опроса (schema.sql) при этом не затрагивается.

-- ---------- Мероприятия ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  section text not null check (section in ('teachers', 'students', 'educational', 'contests', 'methodical')),
  title text not null check (char_length(title) between 3 and 300),
  description text check (char_length(description) <= 2000),
  date_note text check (char_length(date_note) <= 100),   -- «январь», «12–17 числа»
  starts_on date,                                          -- для сортировки и блока «Ближайшие»
  grades text check (char_length(grades) <= 60),           -- «11 класс»
  responsible text check (char_length(responsible) <= 120),
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  sort_order integer not null default 0,
  is_published boolean not null default true
);

-- ---------- Фотографии ----------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid references public.events (id) on delete set null,  -- null = общие фото
  path text not null unique,                                        -- путь в хранилище gallery
  width integer,
  height integer,
  caption text check (char_length(caption) <= 300)
);

create index if not exists photos_event_idx on public.photos (event_id);

-- ---------- Тексты сайта (концепция года) ----------
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Как и у таблицы опроса: RLS включена, политик нет, доступ только у сервера.
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.site_content enable row level security;

-- ---------- Хранилище для фото ----------
-- Публичный bucket: фото открываются по прямой ссылке, загружать может только сервер.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ---------- Стартовая концепция года (из плана работы лицея на 2026–2027) ----------
insert into public.site_content (key, value)
values ('concept', $json$
{
  "year": "2026–2027",
  "theme": "Внедрение технологий искусственного интеллекта (ИИ) в образовательный процесс через компетентностный подход как средство повышения качества образования",
  "goal": "Создание современной образовательной среды, обеспечивающей развитие ключевых компетенций учащихся через эффективное использование ИИ и информационных технологий в обучении и воспитании.",
  "tasks": [
    "Внедрить ИТ-технологии в преподавание всех учебных предметов.",
    "Развивать цифровые компетенции учителей и учащихся.",
    "Применять компетентностный подход при планировании и проведении уроков.",
    "Использовать цифровые образовательные ресурсы и интерактивные методы обучения.",
    "Совершенствовать систему оценки учебных достижений учащихся с использованием цифровых инструментов.",
    "Повышать качество образования через методическую работу и обмен опытом."
  ],
  "directions": [
    { "name": "Методическая работа", "activities": "Семинары по ИТ, открытые уроки, мастер-классы, методические объединения." },
    { "name": "Работа с учителями", "activities": "Повышение квалификации, взаимопосещение уроков, цифровые инструменты." },
    { "name": "Учебная работа", "activities": "Использование презентаций, онлайн-платформ, проектной деятельности." }
  ]
}
$json$::jsonb)
on conflict (key) do nothing;

-- ---------- Стартовый список мероприятий (из документа «Названия семинаров и мероприятий») ----------
-- Даты, ответственных и статусы заполняются потом в админке.
do $$
begin
  if not exists (select 1 from public.events) then
    insert into public.events (section, title, grades, sort_order) values
      ('teachers', 'Искусственный интеллект в деятельности современного учителя: возможности и практика применения', null, 10),
      ('teachers', 'Компетентностный подход и технологии ИИ на современном уроке', null, 20),
      ('teachers', 'ChatGPT и другие ИИ-инструменты в подготовке и проведении уроков', null, 30),
      ('teachers', 'Цифровая грамотность педагога: безопасное и эффективное использование искусственного интеллекта', null, 40),
      ('teachers', 'Искусственный интеллект как средство повышения качества образования', null, 50),
      ('teachers', 'Проектирование современного урока с использованием технологий искусственного интеллекта', null, 60),

      ('students', 'Мир искусственного интеллекта: учимся использовать ИИ с пользой', null, 70),
      ('students', 'ИИ — помощник в учёбе, а не замена знаниям', null, 80),
      ('students', 'Безопасность и этика использования искусственного интеллекта', null, 90),
      ('students', 'Создаём проекты с помощью искусственного интеллекта', null, 100),

      ('educational', 'Классный час «Искусственный интеллект и профессии будущего»', '11 класс', 110),
      ('educational', 'Круглый стол «Ответственное использование искусственного интеллекта»', '10 класс', 120),
      ('educational', 'Дискуссия «ИИ: друг или вызов современному человеку?»', '9 класс', 130),
      ('educational', 'Встреча-презентация «Школа будущего и искусственный интеллект»', '7 класс', 140),

      ('contests', 'Интеллектуальная викторина «Путешествие в мир искусственного интеллекта»', null, 150),
      ('contests', 'КВН «Человек и ИИ — команда будущего»', null, 160),
      ('contests', 'Брейн-ринг «Цифровое поколение: знания об ИИ»', null, 170),
      ('contests', 'Конкурс проектов «ИИ в моей школе»', null, 180),
      ('contests', 'Конкурс презентаций «Школа будущего глазами искусственного интеллекта»', null, 190),

      ('methodical', 'Мастер-класс «Использование ChatGPT в работе учителя»', null, 200),
      ('methodical', 'Фестиваль открытых уроков «ИИ на уроке: лучшие педагогические практики»', null, 210),
      ('methodical', 'Педагогическая мастерская «Современный урок с использованием искусственного интеллекта»', null, 220),
      ('methodical', 'Практикум «ИИ-инструменты для повышения качества обучения и оценивания»', null, 230);
  end if;
end $$;
