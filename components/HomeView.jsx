import Link from 'next/link';
import Icon, { DIRECTION_ICONS } from './Icon';
import OrbitArt from './OrbitArt';
import { dateParts, sectionShort, whenLabel } from '@/lib/sections';

const pad = (n) => String(n).padStart(2, '0');
const delay = (ms) => ({ '--d': `${ms}ms` });

export default function HomeView({ concept, plan, upcoming, recentPhotos, photoTotal, failed }) {
  const totalEvents = plan.reduce((n, s) => n + s.events.length, 0);
  const doneEvents = plan.reduce((n, s) => n + s.done, 0);

  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow rise" style={delay(0)}>
            Учебный год {concept.year}
          </p>
          <h1 className="rise" style={delay(80)}>
            <mark>ИИ</mark> в нашем лицее
          </h1>
          <p className="lead rise" style={delay(170)}>
            {concept.theme}
          </p>
          <div className="actions rise" style={delay(260)}>
            <Link className="btn" href="/survey">
              Пройти опрос
            </Link>
            <Link className="btn btn-ghost" href="/plan">
              План мероприятий
            </Link>
          </div>
        </div>
        <div className="hero-art rise" style={delay(180)}>
          <OrbitArt uid="hero" />
        </div>
      </section>

      {totalEvents > 0 && (
        <dl className="stats">
          <div>
            <dt>мероприятий в плане</dt>
            <dd>{totalEvents}</dd>
          </div>
          <div>
            <dt>уже проведено</dt>
            <dd>{doneEvents}</dd>
          </div>
          <div>
            <dt>направлений работы</dt>
            <dd>{plan.length}</dd>
          </div>
          <div>
            <dt>фото в галерее</dt>
            <dd>{photoTotal}</dd>
          </div>
        </dl>
      )}

      <div className="home-main">
        {concept.goal && (
          <section className="split" aria-labelledby="goal-title">
            <h2 id="goal-title">Цель года</h2>
            <p className="goal">{concept.goal}</p>
          </section>
        )}

        {concept.tasks.length > 0 && (
          <section className="split" aria-labelledby="tasks-title">
            <h2 id="tasks-title">Основные задачи</h2>
            <ol className="task-list">
              {concept.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ol>
          </section>
        )}

        {concept.directions.length > 0 && (
          <section className="split" aria-labelledby="directions-title">
            <h2 id="directions-title">Направления работы</h2>
            <dl className="directions">
              {concept.directions.map((d, i) => (
                <div key={d.name}>
                  <dt>
                    <span className="dir-icon">
                      <Icon name={DIRECTION_ICONS[i % DIRECTION_ICONS.length]} />
                    </span>
                    {d.name}
                  </dt>
                  <dd>{d.activities}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {totalEvents > 0 && (
          <section className="split" aria-labelledby="plan-title">
            <h2 id="plan-title">Ход выполнения плана</h2>
            <ul className="overview">
              {plan.map((section, i) => (
                <li key={section.id}>
                  <Link href={`/plan#section-${section.id}`}>
                    <span className="ov-no">{pad(i + 1)}</span>
                    <span className="ov-title">{section.title}</span>
                    <span className="ov-count">
                      <b>{section.done}</b> из {section.active}
                    </span>
                    <span className="ov-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="ov-bar" aria-hidden="true">
                      <span style={{ width: `${section.active ? (section.done / section.active) * 100 : 0}%` }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="split" aria-labelledby="upcoming-title">
            <h2 id="upcoming-title">Ближайшие мероприятия</h2>
            <ul className="upcoming">
              {upcoming.map((event) => {
                const parts = dateParts(event.starts_on);
                const meta = [sectionShort(event.section), event.grades, event.date_note].filter(Boolean).join(', ');
                return (
                  <li key={event.id}>
                    <span className="date-tile" aria-hidden="true">
                      <b>{parts?.day}</b>
                      <span>{parts?.month}</span>
                    </span>
                    <div>
                      <Link href={`/plan#event-${event.id}`}>{event.title}</Link>
                      <span className="up-meta">{meta || whenLabel(event)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recentPhotos.length > 0 && (
          <section className="split" aria-labelledby="photos-title">
            <div className="split-head">
              <h2 id="photos-title">Из галереи</h2>
              <Link href="/gallery" className="text-link">
                Вся галерея →
              </Link>
            </div>
            <div className={`strip mosaic n${recentPhotos.length}`}>
              {recentPhotos.map((photo) => (
                <Link key={photo.id} href="/gallery" aria-label={photo.caption || 'Открыть галерею'}>
                  <img src={photo.url} alt={photo.caption || ''} loading="lazy" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {failed && totalEvents === 0 && (
        <p className="empty-state">Разделы плана и галереи ещё настраиваются. Загляните сюда чуть позже.</p>
      )}

      <section className="cta" aria-labelledby="cta-title">
        <div className="cta-art" aria-hidden="true">
          <OrbitArt uid="cta" labels={false} tone="dark" />
        </div>
        <div className="cta-copy">
          <p className="eyebrow">Неделя информатики</p>
          <h2 id="cta-title">Как мы пользуемся ИИ?</h2>
          <p>Анонимный опрос на 20 вопросов, около трёх минут. Итоги покажем на неделе информатики.</p>
          <Link className="btn btn-lime" href="/survey">
            Пройти опрос
          </Link>
        </div>
      </section>
    </>
  );
}
