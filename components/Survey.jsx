'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BLOCKS, QUESTIONS, isSkipped } from '@/lib/questions';

const BLOCK_REPEAT = process.env.NEXT_PUBLIC_BLOCK_REPEAT === 'true';
const DONE_KEY = 'ai-survey-done';

function makeToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isAnswered(question, answers) {
  const value = answers[question.column];
  if (question.type === 'multi') return Array.isArray(value) && value.length > 0;
  return value !== undefined && value !== null;
}

export default function Survey() {
  const [phase, setPhase] = useState('intro'); // intro | survey | done
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [token, setToken] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const headingRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => {
    setToken(makeToken());
    if (BLOCK_REPEAT) {
      try {
        if (window.localStorage.getItem(DONE_KEY)) setPhase('done');
      } catch {
        /* localStorage может быть недоступен, это не страшно */
      }
    }
    return () => clearTimeout(advanceTimer.current);
  }, []);

  // Вопросы, которые видит именно этот ученик (без пропущенных).
  const visible = useMemo(() => QUESTIONS.filter((q) => !isSkipped(q, answers)), [answers]);
  const index = Math.min(step, visible.length - 1);
  const current = visible[index];
  const isLast = index === visible.length - 1;
  const answered = isAnswered(current, answers);
  const progress = ((index + (answered ? 1 : 0)) / visible.length) * 100;
  const blockTitle = BLOCKS.find((b) => b.id === current.block)?.title ?? '';

  // При переходе к новому вопросу переносим фокус на заголовок и прокручиваем вверх.
  useEffect(() => {
    if (phase !== 'survey') return;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [index, phase]);

  function goNext() {
    clearTimeout(advanceTimer.current);
    setStep((s) => s + 1);
  }

  function goBack() {
    clearTimeout(advanceTimer.current);
    setError('');
    setStep((s) => Math.max(0, s - 1));
  }

  function pick(question, value) {
    setAnswers((a) => ({ ...a, [question.column]: value }));
    setError('');
    if (!isLast) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(goNext, 220);
    }
  }

  function toggle(question, value) {
    setError('');
    setAnswers((a) => {
      const now = Array.isArray(a[question.column]) ? a[question.column] : [];
      let next;
      if (now.includes(value)) {
        next = now.filter((v) => v !== value);
      } else if (question.exclusive === value) {
        next = [value];
      } else {
        next = [...now.filter((v) => v !== question.exclusive), value];
      }
      return { ...a, [question.column]: next };
    });
  }

  async function submit() {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Не удалось отправить ответы. Попробуйте ещё раз.');
      }
      if (BLOCK_REPEAT) {
        try {
          window.localStorage.setItem(DONE_KEY, '1');
        } catch {
          /* ignore */
        }
      }
      setPhase('done');
    } catch (e) {
      setError(e.message || 'Не удалось отправить ответы. Проверьте интернет и попробуйте ещё раз.');
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setError('');
    setToken(makeToken());
    setPhase('intro');
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!answered || sending) return;
    if (isLast) submit();
    else goNext();
  }

  /* ---------- Вводный экран ---------- */
  if (phase === 'intro') {
    return (
      <main className="shell">
        <div className="topbar">
          <span className="brand"><i aria-hidden="true">✦</i> Неделя информатики</span>
          <a className="admin-link" href="/admin">Администратору</a>
        </div>
        <div className="hero">
          <p className="eyebrow">Анонимный школьный опрос</p>
          <h1>Как мы пользуемся ИИ</h1>
          <p>
            31 августа Таджикистан объявил Днём искусственного интеллекта. Ответьте на несколько
            коротких вопросов, и мы соберём общую картину по школе.
          </p>
          <ul className="facts">
            <li>Опрос анонимный: имя не спрашиваем.</li>
            <li>Займёт около трёх минут.</li>
            <li>Правильных ответов нет, важно ответить честно.</li>
          </ul>
          <div className="actions">
            <button type="button" className="btn" onClick={() => setPhase('survey')}>
              Начать опрос
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Финальный экран ---------- */
  if (phase === 'done') {
    return (
      <main className="shell">
        <div className="topbar">
          <span className="brand"><i aria-hidden="true">✦</i> Неделя информатики</span>
        </div>
        <div className="hero">
          <p className="eyebrow">Готово</p>
          <h1>Спасибо, ответы приняты</h1>
          <p>
            Итоги опроса покажут на неделе информатики: общие цифры и графики по всей школе.
          </p>
          {!BLOCK_REPEAT && (
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={restart}>
                Пройти опрос за другого ученика
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ---------- Вопрос ---------- */
  const isMulti = current.type === 'multi';
  const selected = answers[current.column];

  return (
    <main className="shell">
      <div
        className="progress"
        role="progressbar"
        aria-label="Прогресс опроса"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="topbar">
        <span className="block-pill">{blockTitle}</span>
        <span className="count">
          {index + 1} из {visible.length}
        </span>
      </div>

      <form className="question" onSubmit={onSubmit} noValidate>
        <fieldset className="fieldset" aria-labelledby="q-title">
          <h2 id="q-title" className="q-title" ref={headingRef} tabIndex={-1}>
            {current.title}
          </h2>
          {isMulti && <p className="q-hint">Можно выбрать несколько вариантов</p>}

          <div className={`options${current.layout === 'row' ? ' row' : ''}`}>
            {current.options.map((option) => {
              const checked = isMulti
                ? Array.isArray(selected) && selected.includes(option.value)
                : selected === option.value;
              return (
                <label className="option" key={String(option.value)}>
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={current.column}
                    value={String(option.value)}
                    checked={checked}
                    onChange={() => (isMulti ? toggle(current, option.value) : pick(current, option.value))}
                  />
                  <span className="option-body">
                    <span className={`mark${isMulti ? ' square' : ''}`} aria-hidden="true" />
                    <span>{option.label}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {current.scaleCaps && (
            <div className="scale-caps" aria-hidden="true">
              <span>1: {current.scaleCaps[0].toLowerCase()}</span>
              <span>5: {current.scaleCaps[1].toLowerCase()}</span>
            </div>
          )}
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="nav">
          {index > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={goBack} disabled={sending}>
              Назад
            </button>
          ) : (
            <span className="spacer" />
          )}
          <button type="submit" className="btn" disabled={!answered || sending}>
            {isLast ? (sending ? 'Отправляем…' : 'Отправить ответы') : 'Далее'}
          </button>
        </div>
      </form>
    </main>
  );
}
