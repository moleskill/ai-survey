// Единый источник правды для вопросов: его используют и форма опроса,
// и серверная проверка ответов, и отчёт.
// Значения (value) должны совпадать с CHECK-ограничениями в supabase/schema.sql.

export const BLOCKS = [
  { id: 'general', title: 'Общие вопросы' },
  { id: 'usage', title: 'Как вы пользуетесь ИИ' },
  { id: 'opinion', title: 'Ваше мнение об ИИ' },
];

export const GRADES = [7, 8, 9, 10, 11];

const RAW_QUESTIONS = [
  // ---------- Общие вопросы ----------
  {
    id: 'q1',
    column: 'q1_grade',
    block: 'general',
    type: 'single',
    layout: 'row',
    title: 'В каком вы классе?',
    options: GRADES.map((g) => ({ value: g, label: String(g), reportLabel: `${g} класс` })),
  },
  {
    id: 'q2',
    column: 'q2_knows_ai_day',
    block: 'general',
    type: 'single',
    title: 'Знаете ли вы, что 31 августа в Таджикистане объявлен Днём искусственного интеллекта?',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'partly', label: 'Слышал(а), но без подробностей' },
      { value: 'no', label: 'Нет' },
    ],
  },
  {
    id: 'q3',
    column: 'q3_digitalization',
    block: 'general',
    type: 'single',
    title: 'Как вы относитесь к тому, что Таджикистан начал цифровизацию и внедрение ИИ?',
    options: [
      { value: 'positive', label: 'Положительно' },
      { value: 'neutral', label: 'Нейтрально' },
      { value: 'negative', label: 'Отрицательно' },
      { value: 'unknown', label: 'Не знаю' },
    ],
  },

  // ---------- Использование ----------
  {
    id: 'q4',
    column: 'q4_uses_ai',
    block: 'usage',
    type: 'single',
    title: 'Пользуетесь ли вы ИИ-сервисами?',
    options: [
      { value: 'regularly', label: 'Да, регулярно' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'tried', label: 'Пробовал(а) один-два раза' },
      { value: 'never', label: 'Нет' },
    ],
  },
  {
    id: 'q5',
    column: 'q5_start_year',
    block: 'usage',
    type: 'single',
    onlyUsers: true,
    title: 'В каком году вы впервые начали пользоваться ИИ?',
    options: [
      { value: '2022_or_earlier', label: '2022 или раньше' },
      { value: '2023', label: '2023' },
      { value: '2024', label: '2024' },
      { value: '2025', label: '2025' },
      { value: '2026', label: '2026' },
    ],
  },
  {
    id: 'q6',
    column: 'q6_services',
    block: 'usage',
    type: 'multi',
    sort: 'desc',
    onlyUsers: true,
    title: 'Какими ИИ вы пользуетесь?',
    options: [
      { value: 'chatgpt', label: 'ChatGPT' },
      { value: 'claude', label: 'Claude' },
      { value: 'gemini', label: 'Gemini' },
      { value: 'deepseek', label: 'DeepSeek' },
      { value: 'copilot', label: 'Copilot' },
      { value: 'alice', label: 'Яндекс Алиса' },
      { value: 'other', label: 'Другое' },
    ],
  },
  {
    id: 'q7',
    column: 'q7_frequency',
    block: 'usage',
    type: 'single',
    onlyUsers: true,
    title: 'Как часто вы используете ИИ?',
    options: [
      { value: 'daily', label: 'Каждый день' },
      { value: 'several_week', label: 'Несколько раз в неделю' },
      { value: 'weekly', label: 'Раз в неделю' },
      { value: 'rarely', label: 'Реже' },
    ],
  },
  {
    id: 'q8',
    column: 'q8_daily_time',
    block: 'usage',
    type: 'single',
    onlyUsers: true,
    title: 'Сколько времени в день вы обычно проводите с ИИ?',
    options: [
      { value: 'lt15', label: 'До 15 минут' },
      { value: '15_30', label: '15–30 минут' },
      { value: '30_60', label: '30–60 минут' },
      { value: 'gt60', label: 'Больше часа' },
    ],
  },
  {
    id: 'q9',
    column: 'q9_language',
    block: 'usage',
    type: 'single',
    onlyUsers: true,
    title: 'На каком языке вы чаще общаетесь с ИИ?',
    options: [
      { value: 'ru', label: 'Русский' },
      { value: 'en', label: 'Английский' },
      { value: 'tg', label: 'Таджикский' },
      { value: 'mixed', label: 'По-разному' },
    ],
  },
  {
    id: 'q10',
    column: 'q10_purposes',
    block: 'usage',
    type: 'multi',
    sort: 'desc',
    onlyUsers: true,
    title: 'Для чего вы используете ИИ?',
    options: [
      { value: 'homework', label: 'Домашние задания' },
      { value: 'explain', label: 'Объяснение непонятных тем' },
      { value: 'coding', label: 'Программирование' },
      { value: 'translate', label: 'Перевод' },
      { value: 'creative', label: 'Картинки и творчество' },
      { value: 'search', label: 'Поиск информации' },
      { value: 'fun', label: 'Развлечение' },
    ],
  },
  {
    id: 'q11',
    column: 'q11_subjects',
    block: 'usage',
    type: 'multi',
    sort: 'desc',
    onlyUsers: true,
    title: 'По каким предметам вы чаще всего обращаетесь к ИИ?',
    options: [
      { value: 'math', label: 'Математика' },
      { value: 'physics', label: 'Физика' },
      { value: 'cs', label: 'Информатика' },
      { value: 'russian', label: 'Русский и литература' },
      { value: 'english', label: 'Английский' },
      { value: 'natural', label: 'Естественные науки' },
      { value: 'other', label: 'Другое' },
    ],
  },
  {
    id: 'q12',
    column: 'q12_paid',
    block: 'usage',
    type: 'single',
    boolean: true, // в базе хранится как true/false
    onlyUsers: true,
    title: 'Пользуетесь ли вы платной версией?',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'no', label: 'Нет' },
    ],
  },

  // ---------- Мнение ----------
  {
    id: 'q13',
    column: 'q13_trust',
    block: 'opinion',
    type: 'single',
    layout: 'row',
    onlyUsers: true,
    title: 'Насколько вы доверяете ответам ИИ?',
    scaleCaps: ['Совсем не доверяю', 'Полностью доверяю'],
    options: [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) })),
  },
  {
    id: 'q14',
    column: 'q14_verifies',
    block: 'opinion',
    type: 'single',
    onlyUsers: true,
    title: 'Проверяете ли вы ответы ИИ?',
    options: [
      { value: 'always', label: 'Всегда' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'rarely', label: 'Почти никогда' },
    ],
  },
  {
    id: 'q15',
    column: 'q15_impact',
    block: 'opinion',
    type: 'single',
    title: 'Как ИИ влияет на вашу учёбу?',
    options: [
      { value: 'helps', label: 'Помогает' },
      { value: 'rather_helps', label: 'Скорее помогает' },
      { value: 'none', label: 'Не влияет' },
      { value: 'rather_hurts', label: 'Скорее мешает' },
      { value: 'hurts', label: 'Мешает' },
    ],
  },
  {
    id: 'q16',
    column: 'q16_school_policy',
    block: 'opinion',
    type: 'single',
    title: 'Стоит ли разрешить ИИ в школе?',
    options: [
      { value: 'free', label: 'Да, свободно' },
      { value: 'limited', label: 'Да, с ограничениями' },
      { value: 'no', label: 'Нет' },
    ],
  },
  {
    id: 'q17',
    column: 'q17_taught',
    block: 'opinion',
    type: 'single',
    title: 'Объясняли ли вам в школе, как правильно пользоваться ИИ?',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'partly', label: 'Частично' },
      { value: 'no', label: 'Нет' },
    ],
  },
  {
    id: 'q18',
    column: 'q18_wants_course',
    block: 'opinion',
    type: 'single',
    title: 'Хотели бы вы отдельный урок или курс по ИИ?',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'no', label: 'Нет' },
      { value: 'unknown', label: 'Не знаю' },
    ],
  },
  {
    id: 'q19',
    column: 'q19_concerns',
    block: 'opinion',
    type: 'multi',
    sort: 'desc',
    exclusive: 'none', // «Ничего не опасаюсь» нельзя сочетать с другими вариантами
    title: 'Чего вы больше всего опасаетесь?',
    options: [
      { value: 'cheating', label: 'Списывание и потеря навыков' },
      { value: 'dependence', label: 'Зависимость от ИИ' },
      { value: 'mistakes', label: 'Ошибки в ответах' },
      { value: 'privacy', label: 'Утечка личных данных' },
      { value: 'jobs', label: 'Потеря профессий в будущем' },
      { value: 'none', label: 'Ничего не опасаюсь' },
    ],
  },
  {
    id: 'q20',
    column: 'q20_career',
    block: 'opinion',
    type: 'single',
    title: 'Хотели бы вы связать будущую профессию с ИИ?',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'maybe', label: 'Возможно' },
      { value: 'no', label: 'Нет' },
      { value: 'unknown', label: 'Не знаю' },
    ],
  },
];

export const QUESTIONS = RAW_QUESTIONS.map((q, i) => ({ ...q, num: i + 1 }));

// Вопросы 5–14 не задаём тем, кто ответил «Нет» на вопрос 4.
export function isSkipped(question, answers) {
  return question.onlyUsers === true && answers.q4_uses_ai === 'never';
}

export function getQuestion(id) {
  return QUESTIONS.find((q) => q.id === id);
}
