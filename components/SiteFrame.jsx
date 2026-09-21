import Link from 'next/link';
import SiteNav from './SiteNav';

// Общая рамка публичных страниц: навигация, содержимое, подвал.
export default function SiteFrame({ children }) {
  return (
    <div className="site-wrap">
      <div className="site">
        <SiteNav />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="foot-brand">
            <span className="brand">
              <i aria-hidden="true">M</i> MoleSkill
            </span>
            <p>Базовые курсы, чтобы понимать ИИ и пользоваться им осознанно.</p>
          </div>
          <nav aria-label="Ссылки внизу страницы">
            <Link href="/#courses">Курсы</Link>
            <Link href="/#how">Как это работает</Link>
            <Link href="/admin">Вход для администратора</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
