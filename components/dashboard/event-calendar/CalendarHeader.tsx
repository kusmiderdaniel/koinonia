'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MONTH_KEYS } from './constants'

interface CalendarHeaderProps {
  currentMonth: number
  currentYear: number
  hideCard?: boolean
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentMonth,
  currentYear,
  hideCard,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const t = useTranslations('dashboard')

  return (
    <div className={cn("flex items-center justify-between", hideCard ? "mb-4" : "")}>
      <h3 className="text-lg font-semibold">
        {t(`calendar.months.${MONTH_KEYS[currentMonth]}`)} {currentYear}
      </h3>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 px-3"
          onClick={onToday}
        >
          {t('calendar.today')}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8"
          onClick={onPreviousMonth}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8"
          onClick={onNextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
