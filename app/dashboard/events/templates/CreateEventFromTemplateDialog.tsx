'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, CalendarDays, Music, Users } from 'lucide-react'
import { createEventFromTemplate, getChurchSettings } from './actions'
import { format } from 'date-fns'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { formatTime, formatDurationMinutes } from '@/lib/utils/format'

interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location: { id: string; name: string; address: string | null } | null
  default_start_time: string
  default_duration_minutes: number
  event_template_agenda_items?: Array<{ id: string }>
  event_template_positions?: Array<{ id: string; quantity_needed: number }>
}

interface CreateEventFromTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
}

export function CreateEventFromTemplateDialog({
  open,
  onOpenChange,
  template,
}: CreateEventFromTemplateDialogProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>(1) // Default to Monday

  const loadChurchSettings = async () => {
    const result = await getChurchSettings()
    if (result.data) {
      setFirstDayOfWeek(result.data.firstDayOfWeek as 0 | 1)
    }
  }

  // Load church settings when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDates([])
      setError(null)
      loadChurchSettings()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleCreate = async () => {
    if (selectedDates.length === 0) return

    setIsLoading(true)
    setError(null)

    // Create events for all selected dates
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())

    for (const date of sortedDates) {
      const result = await createEventFromTemplate(
        template.id,
        format(date, 'yyyy-MM-dd')
      )

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(false)
    onOpenChange(false)
    // Force a full page refresh to show newly created events
    window.location.href = '/dashboard/events?view=list'
  }

  const agendaCount = template.event_template_agenda_items?.length || 0
  const positionCount =
    template.event_template_positions?.reduce(
      (sum, p) => sum + p.quantity_needed,
      0
    ) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Create Event from Template</DialogTitle>
          <DialogDescription>
            Select one or more dates for the new events.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          {/* Template Summary - Compact */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <EventTypeBadge type={template.event_type} />
              <h3 className="font-semibold text-sm truncate">{template.name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(template.default_start_time)} • {formatDurationMinutes(template.default_duration_minutes)}
              </span>
              {template.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {template.location.name}
                </span>
              )}
            </div>
          </div>

          {/* Date Picker - Compact */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Tap to select/deselect dates
            </label>
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                weekStartsOn={firstDayOfWeek}
                className="rounded-md border !p-2"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-2",
                  month_caption: "flex justify-center relative items-center h-7",
                  caption_label: "text-xs font-medium",
                  nav: "absolute inset-x-0 flex items-center justify-between",
                  button_previous: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  button_next: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  weekday: "text-muted-foreground w-8 font-normal text-[10px]",
                  week: "flex mt-1",
                  day: "text-center text-xs p-0 h-8 w-8 [&:has([aria-selected])]:!bg-brand [&:has([aria-selected])]:rounded-md",
                  day_button: "h-8 w-8 p-0 font-normal text-xs rounded-md",
                  selected: "!bg-brand !text-brand-foreground hover:!bg-brand hover:!text-brand-foreground focus:!bg-brand focus:!text-brand-foreground rounded-md",
                  today: "bg-accent text-accent-foreground",
                  outside: "day-outside text-muted-foreground opacity-50",
                }}
              />
            </div>
            {selectedDates.length > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="!flex-row gap-3 pt-4 !bg-transparent !border-0">
          <Button
            type="button"
            variant="outline-pill"
            className="flex-1 !border !border-black dark:!border-white"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="outline-pill"
            onClick={handleCreate}
            disabled={isLoading || selectedDates.length === 0}
            className="flex-1 !border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
          >
            {isLoading
              ? 'Creating...'
              : selectedDates.length > 1
              ? `Create ${selectedDates.length}`
              : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
