'use client';

import { useCallback, useEffect, useState } from 'react';
import { BLOCKS, GRADES, QUESTIONS } from '@/lib/questions';
import { buildFindings } from '@/lib/findings';
import { AdoptionChart, BarRows, UsageByGrade } from '@/components/Charts';

const pct = (x, n) => (n ? Math.round((x / n) * 100) : 0);

function QuestionFigure({ question, stats }) {
  const data = stats.questions[question.id];
  const rows = question.options.map((o) => {
    const count = data.counts[String(o.value)] || 0;
    return {
      key: String(o.value),
      label: o.reportLabel ?? o.label,
      count,
      width: pct(count, data.n),
      text: (
        <>
          <b>{pct(count, data.n)}%</b> ({count})
        </>
      ),
    };
  });
  if (question.sort === 'desc') {
    // «Другое» и «Ничего не опасаюсь» всегда в конце списка
    const isTail = (row) => row.key === 'other' || row.key === 'none';
    rows.sort((a, b) => Number(isTail(a)) - Number(isTail(b)) || b.count - a.count);
  }

  return (
    <div className="figure">
      <h3>
        {question.num}. {question.title}
      </h3>
      <p className="sub">
        Ответили: {data.n}
        {question.type === 'multi' ? '. Можно было выбрать несколько вариантов, поэтому сумма больше 100%.' : ''}
      </p>
      <BarRows rows={rows} />
    </div>
  );
}

function TrustByGrade({ trustByGrade }) {
  const rows = GRADES.map((g) => {
    const t = trustByGrade[g];
    return {
      key: String(g),
      label: `${g} класс (ответов: ${t.n})`,
      width: t.avg ? (t.avg / 5) * 100 : 0,
      text: t.avg ? <><b>{t.avg.toFixed(1).replace('.', ',')}</b> из 5</> : 'нет данных',
    };
  });
  return (
    <div className="figure">
      <h3>Среднее доверие к ответам ИИ по классам</h3>
      <p className="sub">Только среди тех, кто пользуется ИИ (вопрос 13).</p>
      <BarRows rows={rows} />
    </div>
  );
}

export default function ReportPage() {
  const [stats, setStats] = useState(null);
  const [courseImpact, setCourseImpact] = useState(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/report');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          window.location.assign('/admin');
          return;
        }
        throw new Error(data.error || 'Не удалось загрузить отчёт');
      }
      setStats(data.stats);
      setCourseImpact(data.courseImpact);
      setGeneratedAt(data.generatedAt);
    } catch (e) {
      setStats(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin');
  }

  if (!stats) {
    return (
      <main className="gate">
        <h1>Отчёт по опросу</h1>
        <p>{loading ? 'Загружаем данные…' : error || 'Переходим к входу администратора…'}</p>
      </main>
    );
  }

  /* ---------- Отчёт ---------- */
  const findings = buildFindings(stats);
  const date = generatedAt
    ? new Date(generatedAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })
    : '';

  return (
    <main className="report">
      <header className="report-head">
        <h1>Отчёт по опросу «ИИ в школе»</h1>
        <p>Неделя информатики. Опрос анонимный, в отчёт попадают только общие цифры.</p>
        {date && <p>Данные на {date}</p>}
        <div className="report-actions no-print">
          <button type="button" className="btn" onClick={() => window.print()}>
            Скачать PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
            {loading ? 'Обновляем…' : 'Обновить данные'}
          </button>
          <a className="btn btn-ghost" href="/admin">Панель администратора</a>
          <button type="button" className="btn btn-ghost" onClick={logout}>Выйти</button>
        </div>
      </header>

      <section className="findings">
        <h2>Главное</h2>
        <ul>
          {findings.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      {courseImpact && (
        <section className="impact-report">
          <p className="eyebrow">MoleSkill · анонимное измерение</p>
          <h2>Эффект курсов</h2>
          {courseImpact.completedCount ? (
            <>
              <p>Сравнение построено только по анонимным парам «до/после» одного и того же курса.</p>
              <div className="impact-numbers">
                <div><span>До курса</span><b>{courseImpact.beforeAverage} / 5</b></div>
                <div><span>После курса</span><b>{courseImpact.afterAverage} / 5</b></div>
                <div><span>Прошли оба теста</span><b>{courseImpact.completedCount}</b></div>
              </div>
              <div className="impact-course-list">
                {courseImpact.byCourse.map((course) => (
                  <div key={course.courseId}>
                    <span>{({ 'ai-start': 'ИИ без магии', prompts: 'Умные запросы', 'safe-ai': 'Безопасно и честно' })[course.courseId]}</span>
                    <b>{course.completedCount ? `${course.beforeAverage} → ${course.afterAverage} из 5` : 'нет завершений'}</b>
                  </div>
                ))}
              </div>
            </>
          ) : <p>Пока нет завершённых пар тестов. Перед стартом и после курса результаты появятся здесь автоматически.</p>}
          <small>Стартовых тестов: {courseImpact.beforeCount} · финальных: {courseImpact.afterCount}</small>
        </section>
      )}

      {stats.total > 0 &&
        BLOCKS.map((block) => (
          <section key={block.id}>
            <h2>{block.title}</h2>
            {QUESTIONS.filter((q) => q.block === block.id).map((q) => (
              <div key={q.id}>
                <QuestionFigure question={q} stats={stats} />

                {q.id === 'q4' && (
                  <div className="figure">
                    <h3>Использование ИИ по классам</h3>
                    <p className="sub">Доли ответов на вопрос 4 внутри каждого класса.</p>
                    <UsageByGrade usageByGrade={stats.usageByGrade} />
                  </div>
                )}

                {q.id === 'q5' && (
                  <div className="figure">
                    <h3>Рост числа пользователей ИИ по годам</h3>
                    <p className="sub">
                      Какая доля всех опрошенных начала пользоваться ИИ к концу каждого года.
                    </p>
                    <AdoptionChart counts={stats.questions.q5.counts} total={stats.total} />
                  </div>
                )}

                {q.id === 'q13' && <TrustByGrade trustByGrade={stats.trustByGrade} />}
              </div>
            ))}
          </section>
        ))}
    </main>
  );
}
