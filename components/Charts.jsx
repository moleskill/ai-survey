// Графики на чистом HTML/CSS/SVG: без сторонних библиотек, поэтому
// одинаково выглядят на экране и в PDF (печать из браузера).

import { GRADES } from '@/lib/questions';

/** Горизонтальные полосы. rows: [{ key, label, width (0..100), text }] */
export function BarRows({ rows }) {
  return (
    <div>
      {rows.map((row) => (
        <div className="bar-row" key={row.key}>
          <div className="bar-label">
            <span>{row.label}</span>
            <span className="bar-value">{row.text}</span>
          </div>
          <div className="bar-track" role="presentation">
            <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, row.width))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const USAGE_SEGMENTS = [
  { key: 'regularly', label: 'Регулярно', color: '#0a6b4e' },
  { key: 'sometimes', label: 'Иногда', color: '#2e8b6b' },
  { key: 'tried', label: 'Пробовали', color: '#a86f00' },
  { key: 'never', label: 'Не пользуются', color: '#6e7c75' },
];

/** Доли ответов на вопрос 4 по классам: каждая строка = 100%. */
export function UsageByGrade({ usageByGrade }) {
  return (
    <div>
      <div className="legend">
        {USAGE_SEGMENTS.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      {GRADES.map((g) => {
        const data = usageByGrade[g];
        return (
          <div className="stack-row" key={g}>
            <div className="bar-label">
              <span>{g} класс</span>
              <span className="bar-value">ответов: {data.n}</span>
            </div>
            {data.n === 0 ? (
              <p className="empty">Нет ответов</p>
            ) : (
              <div className="stack">
                {USAGE_SEGMENTS.map((s) => {
                  const count = data.counts[s.key] || 0;
                  const share = (count / data.n) * 100;
                  if (count === 0) return null;
                  return (
                    <div
                      className="seg"
                      key={s.key}
                      style={{ width: `${share}%`, background: s.color }}
                      title={`${s.label}: ${count}`}
                    >
                      {share >= 9 ? `${Math.round(share)}%` : ''}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const YEARS = [
  ['2022_or_earlier', '2022 и ранее'],
  ['2023', '2023'],
  ['2024', '2024'],
  ['2025', '2025'],
  ['2026', '2026'],
];

/** Линия: какая доля всех опрошенных уже начала пользоваться ИИ к концу года. */
export function AdoptionChart({ counts, total }) {
  const W = 600;
  const H = 250;
  const L = 44;
  const R = 28;
  const T = 30;
  const B = 40;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const INSET = 36; // отступ от осей, чтобы подписи первой и последней точки не налезали на шкалу

  let cumulative = 0;
  const points = YEARS.map(([key, label], i) => {
    cumulative += counts[key] || 0;
    const value = total ? (cumulative / total) * 100 : 0;
    return {
      label,
      value,
      x: L + INSET + ((plotW - 2 * INSET) * i) / (YEARS.length - 1),
      y: T + plotH - (value / 100) * plotH,
    };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${first.x},${T + plotH} ${line} ${last.x},${T + plotH}`;
  const grid = [0, 25, 50, 75, 100];

  return (
    <svg
      className="linechart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Доля опрошенных, начавших пользоваться ИИ, по годам"
    >
      {grid.map((v) => {
        const y = T + plotH - (v / 100) * plotH;
        return (
          <g key={v}>
            <line x1={L} x2={L + plotW} y1={y} y2={y} stroke="#d5ddd7" strokeWidth="1" />
            <text x={L - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#56675e">
              {v}%
            </text>
          </g>
        );
      })}
      <polygon points={area} fill="#0a6b4e" fillOpacity="0.12" />
      <polyline points={line} fill="none" stroke="#0a6b4e" strokeWidth="3" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#0a6b4e" strokeWidth="3" />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="13" fontWeight="600" fill="#12231c">
            {Math.round(p.value)}%
          </text>
          <text x={p.x} y={H - 14} textAnchor="middle" fontSize="12" fill="#56675e">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
