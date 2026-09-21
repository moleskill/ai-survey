import { SECTIONS } from '@/lib/sections';

// Декоративная иллюстрация: «орбиты» с узлами вокруг светящегося ядра.
// Вокруг среднего кольца подписаны 5 разделов плана. Чистый SVG + CSS, без картинок.

const PILL_ANGLES = [-100, -32, 38, 140, 212]; // градусы на среднем кольце
const rad = (deg) => (deg * Math.PI) / 180;
const point = (r, deg) => [200 + r * Math.cos(rad(deg)), 200 + r * Math.sin(rad(deg))];

function Nodes({ r, angles, cls, size = 6, spokes = false }) {
  return angles.map((a) => {
    const [x, y] = point(r, a);
    return (
      <g key={`${r}-${a}`}>
        {spokes && <line className="spoke" x1="200" y1="200" x2={x} y2={y} />}
        <circle className={`n ${cls}`} cx={x} cy={y} r={size} />
      </g>
    );
  });
}

export default function OrbitArt({ uid = 'orbit', labels = true, tone = 'light' }) {
  const pillRadius = 38; // % от ширины, совпадает с кольцом r=152 в viewBox 400

  return (
    <div className={`orbit ${tone}`} aria-hidden="true">
      <svg className="orbit-svg" viewBox="0 0 400 400" focusable="false">
        <defs>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9f36a" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#c9f36a" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#c9f36a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-core`} cx="34%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#f4ffcf" />
            <stop offset="55%" stopColor="#c9f36a" />
            <stop offset="100%" stopColor="#62c04a" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="198" fill={`url(#${uid}-halo)`} />

        <g className="spin slow">
          <circle className="r r-dash" cx="200" cy="200" r="184" />
          <Nodes r={184} angles={[20, 155, 262]} cls="n-lime" size={7} />
        </g>

        <g className="spin rev">
          <circle className="r r-solid" cx="200" cy="200" r="152" />
        </g>

        <g className="spin fast">
          <circle className="r" cx="200" cy="200" r="100" />
          <Nodes r={100} angles={[60, 200, 305]} cls="n-white" size={6} spokes />
          <Nodes r={100} angles={[128]} cls="n-ink" size={4.5} />
        </g>

        <circle className="pulse" cx="200" cy="200" r="54" />
        <circle cx="200" cy="200" r="54" fill={`url(#${uid}-core)`} />
        <path
          d="M200 172l6.2 19.8L226 198l-19.8 6.2L200 224l-6.2-19.8L174 198l19.8-6.2L200 172Z"
          fill="#14231e"
          transform="translate(0 2)"
        />
      </svg>

      {labels &&
        SECTIONS.map((section, i) => {
          const a = rad(PILL_ANGLES[i]);
          return (
            <span
              key={section.id}
              className="orbit-pill"
              style={{
                left: `${50 + pillRadius * Math.cos(a)}%`,
                top: `${50 + pillRadius * Math.sin(a)}%`,
                '--i': i,
              }}
            >
              {section.short}
            </span>
          );
        })}
    </div>
  );
}
