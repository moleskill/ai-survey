import { CHECK_QUESTIONS, findCourse } from './courses';

export function validateAssessment(body) {
  const course = findCourse(body?.courseId);
  if (!course) return { ok: false, error: 'Курс не найден.' };
  if (!['before', 'after'].includes(body?.stage)) return { ok: false, error: 'Неизвестный этап теста.' };
  if (typeof body?.learnerToken !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.learnerToken)) {
    return { ok: false, error: 'Не удалось создать анонимный идентификатор.' };
  }
  if (!body.answers || typeof body.answers !== 'object') return { ok: false, error: 'Ответьте на все вопросы.' };
  let score = 0;
  for (const question of CHECK_QUESTIONS) {
    const value = body.answers[question.id];
    if (!Number.isInteger(value) || value < 0 || value >= question.options.length) {
      return { ok: false, error: 'Ответьте на все вопросы.' };
    }
    if (value === question.correct) score += 1;
  }
  return { ok: true, row: { learner_token: body.learnerToken, course_id: course.id, stage: body.stage, score, answers: body.answers } };
}

export function buildCourseImpact(rows) {
  const before = rows.filter((row) => row.stage === 'before');
  const after = rows.filter((row) => row.stage === 'after');
  const paired = new Map();
  for (const row of rows) {
    const key = `${row.learner_token}:${row.course_id}`;
    const current = paired.get(key) || {};
    current[row.stage] = row;
    paired.set(key, current);
  }
  const completed = [...paired.values()].filter((entry) => entry.before && entry.after);
  const average = (items) => items.length ? Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 10) / 10 : 0;
  const byCourse = ['ai-start', 'prompts', 'safe-ai'].map((courseId) => {
    const pairs = completed.filter((entry) => entry.before.course_id === courseId);
    const beforeAverage = average(pairs.map((entry) => entry.before));
    const afterAverage = average(pairs.map((entry) => entry.after));
    return { courseId, completedCount: pairs.length, beforeAverage, afterAverage, improvement: pairs.length ? Math.round((afterAverage - beforeAverage) * 10) / 10 : 0 };
  });
  return { beforeCount: before.length, afterCount: after.length, completedCount: completed.length, beforeAverage: average(completed.map((entry) => entry.before)), afterAverage: average(completed.map((entry) => entry.after)), byCourse };
}
