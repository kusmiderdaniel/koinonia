'use client'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Calendar,
  List,
  CalendarDays,
  FileText,
  Grid3X3,
  Plus,
} from 'lucide-react'

type ViewMode = 'list' | 'calendar' | 'matrix' | 'templates'

interface EventsHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  canManage: boolean
  canManageContent: boolean
  onOpenTemplatePicker: () => void
  onOpenCreateDialog: () => void
}

export function EventsHeader({
  viewMode,
  onViewModeChange,
  canManage,
  canManageContent,
  onOpenTemplatePicker,
  onOpenCreateDialog,
}: EventsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Events</h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
          className="!border !border-black dark:!border-white rounded-full p-1 gap-1"
        >
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
          >
            <List className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="calendar"
            aria-label="Calendar view"
            className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
          >
            <CalendarDays className="w-4 h-4" />
          </ToggleGroupItem>
          {canManageContent && (
            <ToggleGroupItem
              value="matrix"
              aria-label="Scheduling matrix"
              className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
            >
              <Grid3X3 className="w-4 h-4" />
            </ToggleGroupItem>
          )}
          {canManageContent && (
            <ToggleGroupItem
              value="templates"
              aria-label="Templates"
              className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
            >
              <FileText className="w-4 h-4" />
            </ToggleGroupItem>
          )}
        </ToggleGroup>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full !border !border-black dark:!border-white hidden md:flex"
              onClick={onOpenTemplatePicker}
            >
              <FileText className="w-4 h-4 mr-2" />
              From Template
            </Button>
            <Button
              variant="outline"
              className="rounded-full !border !border-black dark:!border-white"
              onClick={onOpenCreateDialog}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Add</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
