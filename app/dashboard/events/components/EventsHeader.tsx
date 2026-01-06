'use client'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Calendar,
  List,
  CalendarDays,
  FileText,
  Grid3X3,
} from 'lucide-react'

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
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">
          {viewMode === 'templates' ? 'Event Templates' : 'Events'}
        </h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider delayDuration={300}>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
            className="!border !border-black dark:!border-white rounded-full p-1 gap-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <ToggleGroupItem
                    value="list"
                    aria-label="List view"
                    className={`!rounded-full ${viewMode === 'list' ? '!bg-brand !text-brand-foreground' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                </span>
              </TooltipTrigger>
              <TooltipContent>List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <ToggleGroupItem
                    value="calendar"
                    aria-label="Calendar view"
                    className={`!rounded-full ${viewMode === 'calendar' ? '!bg-brand !text-brand-foreground' : ''}`}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </ToggleGroupItem>
                </span>
              </TooltipTrigger>
              <TooltipContent>Calendar</TooltipContent>
            </Tooltip>
            {canManageContent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ToggleGroupItem
                      value="matrix"
                      aria-label="Scheduling matrix"
                      className={`!rounded-full ${viewMode === 'matrix' ? '!bg-brand !text-brand-foreground' : ''}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
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
                      className={`!rounded-full ${viewMode === 'templates' ? '!bg-brand !text-brand-foreground' : ''}`}
                    >
                      <FileText className="w-4 h-4" />
                    </ToggleGroupItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Templates</TooltipContent>
              </Tooltip>
            )}
          </ToggleGroup>
        </TooltipProvider>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full !border !border-black dark:!border-white hidden md:flex"
              onClick={onOpenTemplatePicker}
            >
              <FileText className="w-4 h-4 mr-2" />
              Event From Template
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
