'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Home() {
  const locale = useLocale();
  const t = useTranslations('auth');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">
          {locale === 'pl' ? 'Witamy w Koinonia' : 'Welcome to Koinonia'}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {locale === 'pl'
            ? 'Usprawnij operacje kościelne, zarządzanie wolontariuszami i koordynację wydarzeń'
            : 'Streamline church operations, volunteer management, and event coordination'
          }
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={`/${locale}/auth/signin`}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {t('signIn')}
          </Link>
          <Link
            href={`/${locale}/auth/signup`}
            className="px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            {t('signUp')}
          </Link>
        </div>
      </div>
    </main>
  );
}
