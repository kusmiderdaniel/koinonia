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
import { formatTimeString, formatDurationMinutes } from '@/lib/utils/format'

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

  // Load church settings when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDates([])
      setError(null)
      loadChurchSettings()
    }
  }, [open])

  const loadChurchSettings = async () => {
    const result = await getChurchSettings()
    if (result.data) {
      setFirstDayOfWeek(result.data.firstDayOfWeek as 0 | 1)
    }
  }

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
            Select dates for the new events. Hold Cmd/Ctrl to select multiple dates.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Template Summary */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <EventTypeBadge type={template.event_type} />
            </div>
            <h3 className="font-semibold">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {template.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimeString(template.default_start_time)}</span>
                <span>•</span>
                <span>{formatDurationMinutes(template.default_duration_minutes)}</span>
              </div>
              {template.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{template.location.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5" />
                <span>{agendaCount} agenda items</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{positionCount} positions</span>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Select Event Date{selectedDates.length > 1 ? 's' : ''} *
            </label>
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                weekStartsOn={firstDayOfWeek}
                className="rounded-md border"
                classNames={{
                  selected: "bg-brand text-brand-foreground hover:bg-brand hover:text-brand-foreground focus:bg-brand focus:text-brand-foreground rounded-md",
                  today: "bg-accent text-accent-foreground",
                  outside: "day-outside text-muted-foreground aria-selected:bg-brand aria-selected:text-brand-foreground",
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

        <DialogFooter className="flex justify-end gap-3 pt-4 !bg-transparent !border-0">
          <Button
            type="button"
            variant="outline-pill"
            className="!border !border-black dark:!border-white"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="outline-pill"
            onClick={handleCreate}
            disabled={isLoading || selectedDates.length === 0}
            className="!border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
          >
            {isLoading
              ? 'Creating...'
              : selectedDates.length > 1
              ? `Create ${selectedDates.length} Events`
              : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
