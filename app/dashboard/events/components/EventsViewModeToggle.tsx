'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  List,
  CalendarDays,
  Grid3X3,
  FileText,
} from 'lucide-react'

type ViewMode = 'list' | 'calendar' | 'matrix' | 'templates'

interface EventsViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  canManageContent: boolean
  compact?: boolean
  mobileOnly?: boolean // When true, only show list and templates (no calendar/matrix)
}

export function EventsViewModeToggle({
  viewMode,
  onViewModeChange,
  canManageContent,
  compact = false,
  mobileOnly = false,
}: EventsViewModeToggleProps) {
  const showCalendar = !mobileOnly
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
                aria-label="List view"
                className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'list' ? '!bg-brand !text-brand-foreground' : ''}`}
              >
                <List className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </ToggleGroupItem>
            </span>
          </TooltipTrigger>
          <TooltipContent>List</TooltipContent>
        </Tooltip>
        {showCalendar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ToggleGroupItem
                  value="calendar"
                  aria-label="Calendar view"
                  className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'calendar' ? '!bg-brand !text-brand-foreground' : ''}`}
                >
                  <CalendarDays className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>Calendar</TooltipContent>
          </Tooltip>
        )}
        {showMatrix && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ToggleGroupItem
                  value="matrix"
                  aria-label="Scheduling matrix"
                  className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'matrix' ? '!bg-brand !text-brand-foreground' : ''}`}
                >
                  <Grid3X3 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>Scheduling Matrix</TooltipContent>
          </Tooltip>
        )}
        {canManageContent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ToggleGroupItem
                  value="templates"
                  aria-label="Templates"
                  className={`!rounded-full ${compact ? 'h-8 w-8' : ''} ${viewMode === 'templates' ? '!bg-brand !text-brand-foreground' : ''}`}
                >
                  <FileText className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>Templates</TooltipContent>
          </Tooltip>
        )}
      </ToggleGroup>
    </TooltipProvider>
  )
}
