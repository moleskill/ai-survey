import { QUESTIONS, isSkipped } from './questions';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fail = (error) => ({ ok: false, error });

// Проверяет ответы на сервере (на клиента полагаться нельзя)
// и собирает строку для таблицы responses.
export function validateSubmission(body) {
  if (!body || typeof body !== 'object') return fail('Некорректный запрос');

  const { token, answers } = body;
  if (typeof token !== 'string' || !UUID_RE.test(token)) {
    return fail('Некорректный идентификатор отправки. Обновите страницу и попробуйте снова.');
  }
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return fail('Нет ответов');
  }

  const row = { submission_token: token };

  for (const q of QUESTIONS) {
    if (isSkipped(q, answers)) {
      row[q.column] = null;
      continue;
    }

    const value = answers[q.column];
    const allowed = q.options.map((o) => o.value);

    if (q.type === 'multi') {
      if (!Array.isArray(value) || value.length === 0 || value.length > allowed.length) {
        return fail(`Ответьте на вопрос ${q.num}`);
      }
      const unique = new Set(value).size === value.length;
      if (!unique || !value.every((v) => allowed.includes(v))) {
        return fail(`Некорректный ответ на вопрос ${q.num}`);
      }
      if (q.exclusive && value.includes(q.exclusive) && value.length > 1) {
        return fail(`Некорректный ответ на вопрос ${q.num}`);
      }
      row[q.column] = value;
    } else {
      if (!allowed.includes(value)) {
        return fail(`Ответьте на вопрос ${q.num}`);
      }
      row[q.column] = q.boolean ? value === 'yes' : value;
    }
  }

  return { ok: true, row };
}
