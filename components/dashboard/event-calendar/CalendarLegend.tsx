'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_COLORS } from './constants'

export function CalendarLegend() {
  const t = useTranslations('dashboard')

  return (
    <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
      {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
        <div key={type} className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', color)} />
          <span>{t(`calendar.eventTypes.${type}`)}</span>
        </div>
      ))}
    </div>
  )
}
