'use client'

import { useTranslations } from 'next-intl'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  List,
  Grid3X3,
  FileText,
} from 'lucide-react'

type ViewMode = 'list' | 'matrix' | 'templates'

interface EventsViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  canManageContent: boolean
  compact?: boolean
  mobileOnly?: boolean // When true, only show list and templates (no matrix)
}

export function EventsViewModeToggle({
  viewMode,
  onViewModeChange,
  canManageContent,
  compact = false,
  mobileOnly = false,
}: EventsViewModeToggleProps) {
  const t = useTranslations('events.viewModes')
  const showMatrix = !mobileOnly && canManageContent

  return (
    <TooltipProvider delayDuration={300}>
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
        className={`!border !border-black dark:!border-white rounded-full p-1 gap-1 ${compact ? 'p-0.5 gap-0.5' : ''}`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ToggleGroupItem
                value="list"
                aria-label={t('list')}
                className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'list' ? '!bg-brand !text-brand-foreground' : ''}`}
              >
                <List className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </ToggleGroupItem>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t('list')}</TooltipContent>
        </Tooltip>
        {showMatrix && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ToggleGroupItem
                  value="matrix"
                  aria-label={t('matrix')}
                  className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'matrix' ? '!bg-brand !text-brand-foreground' : ''}`}
                >
                  <Grid3X3 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('matrix')}</TooltipContent>
          </Tooltip>
        )}
        {canManageContent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ToggleGroupItem
                  value="templates"
                  aria-label={t('templates')}
                  className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'templates' ? '!bg-brand !text-brand-foreground' : ''}`}
                >
                  <FileText className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('templates')}</TooltipContent>
          </Tooltip>
        )}
      </ToggleGroup>
    </TooltipProvider>
  )
}
