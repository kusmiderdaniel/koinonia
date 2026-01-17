'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/lib/hooks'

interface TasksHeaderProps {
  taskCount: number
  currentViewName?: string | null
}

export function TasksHeader({ taskCount, currentViewName }: TasksHeaderProps) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()

  return (
    <div className={`${isMobile ? 'mb-2' : 'mb-4'}`}>
      <div className="flex items-center gap-2">
        <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{t('title')}</h1>
        {currentViewName && (
          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            / {currentViewName}
          </span>
        )}
      </div>
      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
        {t('taskCount', { count: taskCount })}
      </p>
    </div>
  )
}
