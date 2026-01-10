'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'

interface TasksHeaderProps {
  taskCount: number
  onCreateTask: () => void
  currentViewName?: string | null
}

export function TasksHeader({ taskCount, onCreateTask, currentViewName }: TasksHeaderProps) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()

  return (
    <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
      <div>
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
      <Button
        onClick={onCreateTask}
        variant="outline"
        size={isMobile ? 'sm' : 'default'}
        className="rounded-full !border !border-black dark:!border-white"
      >
        <Plus className={isMobile ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-2'} />
        {isMobile ? t('new') : t('newTask')}
      </Button>
    </div>
  )
}
