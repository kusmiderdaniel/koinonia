'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Calendar, FileText } from 'lucide-react'
import { EventsViewModeToggle } from './EventsViewModeToggle'

type ViewMode = 'list' | 'calendar' | 'matrix' | 'templates'

interface EventsHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  canManage: boolean
  canManageContent: boolean
  onOpenTemplatePicker: () => void
  onOpenCreateDialog?: () => void
}

export function EventsHeader({
  viewMode,
  onViewModeChange,
  canManage,
  canManageContent,
  onOpenTemplatePicker,
}: EventsHeaderProps) {
  const t = useTranslations('events')

  return (
    <div className="hidden md:flex md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">
          {viewMode === 'templates' ? t('templates') : t('title')}
        </h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <EventsViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          canManageContent={canManageContent}
        />
        {canManage && (
          <Button
            variant="outline"
            className="rounded-full !border !border-black dark:!border-white"
            onClick={onOpenTemplatePicker}
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('eventFromTemplate')}
          </Button>
        )}
      </div>
    </div>
  )
}
