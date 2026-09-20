import { QUESTIONS, GRADES } from './questions';

// Считает агрегаты по строкам таблицы. Сырые ответы в браузер не отдаются,
// наружу уходят только счётчики.
export function computeStats(rows) {
  const questions = {};
  for (const q of QUESTIONS) {
    questions[q.id] = { n: 0, counts: {} };
  }

  const usageByGrade = {};
  const trustAcc = {};
  for (const g of GRADES) {
    usageByGrade[g] = { n: 0, counts: {} };
    trustAcc[g] = { n: 0, sum: 0 };
  }

  for (const row of rows) {
    for (const q of QUESTIONS) {
      const raw = row[q.column];
      if (raw === null || raw === undefined) continue;

      const bucket = questions[q.id];
      bucket.n += 1;

      const values = Array.isArray(raw) ? raw : [typeof raw === 'boolean' ? (raw ? 'yes' : 'no') : raw];
      for (const item of values) {
        const key = String(item);
        bucket.counts[key] = (bucket.counts[key] || 0) + 1;
      }
    }

    const g = row.q1_grade;
    if (usageByGrade[g]) {
      usageByGrade[g].n += 1;
      const key = row.q4_uses_ai;
      usageByGrade[g].counts[key] = (usageByGrade[g].counts[key] || 0) + 1;

      if (typeof row.q13_trust === 'number') {
        trustAcc[g].n += 1;
        trustAcc[g].sum += row.q13_trust;
      }
    }
  }

  const trustByGrade = {};
  for (const g of GRADES) {
    trustByGrade[g] = {
      n: trustAcc[g].n,
      avg: trustAcc[g].n ? trustAcc[g].sum / trustAcc[g].n : null,
    };
  }

  return { total: rows.length, questions, usageByGrade, trustByGrade };
}
