import './globals.css';
import './site.css';
import { Unbounded, Golos_Text } from 'next/font/google';

const display = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: { default: 'MoleSkill', template: '%s | MoleSkill' },
  description: 'Базовые курсы по искусственному интеллекту: понятно, безопасно и без регистрации.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
