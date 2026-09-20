import { getQuestion } from './questions';

const pct = (x, n) => (n ? Math.round((x / n) * 100) : null);
const fmt1 = (v) => v.toFixed(1).replace('.', ',');

// Собирает текстовые выводы для верхней части отчёта.
export function buildFindings(stats) {
  const Q = stats.questions;
  const total = stats.total;

  if (!total) return ['Пока нет ни одного ответа.'];

  const cnt = (id, v) => Q[id].counts[String(v)] || 0;
  const n = (id) => Q[id].n;
  const labelOf = (id, value) => {
    const opt = getQuestion(id).options.find((o) => String(o.value) === String(value));
    return opt ? opt.label : String(value);
  };
  const top = (id, skip = []) => {
    const entries = Object.entries(Q[id].counts)
      .filter(([k]) => !skip.includes(k))
      .sort((a, b) => b[1] - a[1]);
    return entries.length && entries[0][1] > 0 ? { value: entries[0][0], count: entries[0][1] } : null;
  };

  const out = [];
  out.push(`Всего получено ответов: ${total}.`);

  if (n('q4')) {
    const reg = cnt('q4', 'regularly');
    const some = cnt('q4', 'sometimes');
    const tried = cnt('q4', 'tried');
    const never = cnt('q4', 'never');
    out.push(
      `ИИ-сервисами пользуются ${pct(reg + some, n('q4'))}% опрошенных (регулярно: ${pct(reg, n('q4'))}%), ` +
        `ещё ${pct(tried, n('q4'))}% пробовали, ${pct(never, n('q4'))}% не пользуются.`
    );
  }

  if (n('q2')) {
    out.push(
      `О том, что 31 августа объявлен Днём ИИ, знают ${pct(cnt('q2', 'yes'), n('q2'))}% школьников, ` +
        `ещё ${pct(cnt('q2', 'partly'), n('q2'))}% слышали об этом без подробностей.`
    );
  }

  const service = n('q6') ? top('q6') : null;
  if (service) {
    out.push(
      `Самый популярный сервис: ${labelOf('q6', service.value)} (${pct(service.count, n('q6'))}% пользователей).`
    );
  }

  const purpose = n('q10') ? top('q10') : null;
  if (purpose) {
    out.push(
      `Чаще всего ИИ используют для цели «${labelOf('q10', purpose.value)}» (${pct(purpose.count, n('q10'))}%).`
    );
  }

  if (n('q13')) {
    let sum = 0;
    for (let v = 1; v <= 5; v += 1) sum += v * cnt('q13', v);
    out.push(`Средний уровень доверия к ответам ИИ: ${fmt1(sum / n('q13'))} из 5.`);
  }

  if (n('q14')) {
    out.push(
      `Всегда проверяют ответы ИИ ${pct(cnt('q14', 'always'), n('q14'))}% пользователей, ` +
        `почти никогда не проверяют ${pct(cnt('q14', 'rarely'), n('q14'))}%.`
    );
  }

  if (n('q15')) {
    const helps = cnt('q15', 'helps') + cnt('q15', 'rather_helps');
    const hurts = cnt('q15', 'hurts') + cnt('q15', 'rather_hurts');
    out.push(
      `По мнению ${pct(helps, n('q15'))}% опрошенных, ИИ помогает учёбе; по мнению ${pct(hurts, n('q15'))}%, мешает.`
    );
  }

  if (n('q16')) {
    const allow = cnt('q16', 'free') + cnt('q16', 'limited');
    out.push(`Разрешить ИИ в школе (свободно или с ограничениями) считают правильным ${pct(allow, n('q16'))}%.`);
  }

  if (n('q17')) {
    out.push(`${pct(cnt('q17', 'no'), n('q17'))}% школьников говорят, что им не объясняли, как правильно пользоваться ИИ.`);
  }

  if (n('q18')) {
    out.push(`Отдельный урок или курс по ИИ хотели бы ${pct(cnt('q18', 'yes'), n('q18'))}%.`);
  }

  const concern = n('q19') ? top('q19', ['none']) : null;
  if (concern) {
    out.push(
      `Главное опасение: «${labelOf('q19', concern.value)}» (${pct(concern.count, n('q19'))}%).`
    );
  }

  if (n('q20')) {
    out.push(
      `Связать будущую профессию с ИИ хотят или рассматривают такую возможность ${pct(
        cnt('q20', 'yes') + cnt('q20', 'maybe'),
        n('q20')
      )}%.`
    );
  }

  return out;
}
