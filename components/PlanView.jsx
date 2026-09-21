import Link from 'next/link';
import { statusLabel, whenLabel } from '@/lib/sections';

const pad = (n) => String(n).padStart(2, '0');
const delay = (ms) => ({ '--d': `${ms}ms` });

export default function PlanView({ plan, failed }) {
  const total = plan.reduce((n, s) => n + s.events.length, 0);
  const done = plan.reduce((n, s) => n + s.done, 0);
  const active = plan.reduce((n, s) => n + s.active, 0);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow rise" style={delay(0)}>
          План мероприятий
        </p>
        <h1 className="rise" style={delay(80)}>
          <mark>Мероприятия</mark> года
        </h1>
        <p className="lead rise" style={delay(160)}>
          Семинары, классные часы, конкурсы и методические встречи по теме искусственного интеллекта в образовании.
        </p>
        {total > 0 && (
          <div className="overall rise" style={delay(240)}>
            <div className="overall-bar" aria-hidden="true">
              <span style={{ width: `${active ? (done / active) * 100 : 0}%` }} />
            </div>
            <p>
              Проведено <b>{done}</b> из {active}
            </p>
          </div>
        )}
      </header>

      {total === 0 ? (
        <p className="empty-state">
          {failed
            ? 'План мероприятий ещё настраивается. Загляните сюда чуть позже.'
            : 'Мероприятия пока не добавлены.'}
        </p>
      ) : (
        <>
          <nav className="chips" aria-label="Разделы плана">
            {plan.map((section, i) => (
              <a key={section.id} className="chip" href={`#section-${section.id}`}>
                <span className="chip-no">{pad(i + 1)}</span>
                {section.short} <b>{section.events.length}</b>
              </a>
            ))}
          </nav>

          {plan.map((section, i) => (
            <section className="plan-section" id={`section-${section.id}`} key={section.id}>
              <div className="ps-side">
                <span className="ps-no">{pad(i + 1)}</span>
                <h2>{section.title}</h2>
                <p className="muted">
                  {section.done} из {section.active} проведено
                </p>
                <div className="ps-bar" aria-hidden="true">
                  <span style={{ width: `${section.active ? (section.done / section.active) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="ps-main">
                {section.events.length === 0 ? (
                  <p className="muted">Пока ничего не запланировано.</p>
                ) : (
                  <ul className="event-list">
                    {section.events.map((event) => {
                      const when = whenLabel(event);
                      return (
                        <li className={`event ${event.status}`} id={`event-${event.id}`} key={event.id}>
                          <div className="event-top">
                            <span className={`event-when${when ? '' : ' tbd'}`}>{when || 'Дата уточняется'}</span>
                            {event.grades && <span className="event-grades">{event.grades}</span>}
                            <span className={`pill ${event.status}`}>{statusLabel(event.status)}</span>
                          </div>
                          <h3>{event.title}</h3>
                          {event.description && <p>{event.description}</p>}
                          {event.responsible && <p>Ответственный: {event.responsible}</p>}
                          {event.photoCount > 0 && (
                            <Link className="event-photos" href={`/gallery#event-${event.id}`}>
                              Фото: {event.photoCount} →
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
