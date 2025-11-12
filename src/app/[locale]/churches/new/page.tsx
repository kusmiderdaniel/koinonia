'use client';

import { CreateChurchForm } from '@/components/church/CreateChurchForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function NewChurchPage() {
  const locale = useLocale();
  const t = useTranslations('church');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/churches`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do kościołów' : 'Back to Churches'}
        </Link>
        <h1 className="text-3xl font-bold">{t('createChurchTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('createChurchDescription')}
        </p>
      </div>

      <CreateChurchForm />
    </div>
  );
}
