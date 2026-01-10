'use client'

import { useTranslations } from 'next-intl'
import { HelpCircle } from 'lucide-react'

export function HelpCard() {
  const t = useTranslations('calendar-integration')

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t('help.title')}</h2>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>{t('help.subscription')}</p>
        <p>{t('help.google')}</p>
        <p>{t('help.apple')}</p>
        <p>{t('help.note')}</p>
      </div>
    </div>
  )
}
