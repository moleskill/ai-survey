'use client';

import Link from 'next/link';
import { COURSES } from '@/lib/courses';

export default function CourseHub() {
  return (
    <div className="course-hub">
      <section className="ms-hero">
        <div className="ms-hero-copy">
          <p className="ms-kicker"><span>●</span> Простое образование об ИИ</p>
          <h1>Освой ИИ.<br /><em>Сохрани себя.</em></h1>
          <p className="ms-lead">Короткие курсы, которые помогут понимать ИИ, задавать ему правильные вопросы и пользоваться им ответственно.</p>
          <div className="ms-actions"><a className="ms-button" href="#courses">Выбрать курс <span>→</span></a><a className="ms-text-button" href="#how">Как это работает</a></div>
          <div className="ms-trust"><span className="avatar-stack"><i>А</i><i>М</i><i>Л</i></span><span>Учись в своём темпе<br /><b>без регистрации</b></span></div>
        </div>
        <div className="ms-hero-visual" aria-label="Иллюстрация: обучение и искусственный интеллект">
          <div className="ms-visual-glow" />
          <div className="ms-orb ms-orb-one">AI</div><div className="ms-orb ms-orb-two">✦</div>
          <div className="ms-window"><div className="ms-window-bar"><span /><span /><span /></div><div className="ms-window-body"><p>Помоги понять<br /><b>сложное.</b></p><div className="ms-message">Конечно! Начнём с простого.</div><div className="ms-prompt">Спроси что-нибудь… <b>↑</b></div></div></div>
          <p className="ms-visual-caption">Понимать важнее,<br />чем просто нажимать.</p>
        </div>
      </section>

      <section className="course-section" id="courses" aria-labelledby="courses-title">
        <div className="section-heading"><div><p className="ms-kicker"><span>01</span> Начни здесь</p><h2 id="courses-title">Твоя база для <em>работы с ИИ</em></h2></div><p>Каждый курс — без сложных слов, с примерами и маленькой проверкой понимания.</p></div>
        <div className="course-grid">
          {COURSES.map((course) => <article className={`course-card ${course.color}`} key={course.id}><div className="course-card-top"><span>{course.number}</span><span className="course-spark">✦</span></div><h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span>{course.duration}</span><span>{course.level}</span></div><Link href={`/courses/${course.id}`} className="course-link">Начать курс <b>→</b></Link></article>)}
        </div>
      </section>

      <section className="how-section" id="how"><p className="ms-kicker"><span>02</span> Честный результат</p><h2>Проверяем, <em>помогает ли обучение</em></h2><div className="how-grid"><div><b>01</b><h3>До курса</h3><p>Короткий анонимный тест покажет стартовую точку.</p></div><div><b>02</b><h3>Учись</h3><p>Пройди три понятных урока в удобном темпе.</p></div><div><b>03</b><h3>После курса</h3><p>Повтори тест — общая статистика покажет эффект курса.</p></div></div><p className="privacy-note">Мы не спрашиваем имя, почту или телефон. Для сравнения используется случайный код только в этом браузере.</p></section>
    </div>
  );
}
