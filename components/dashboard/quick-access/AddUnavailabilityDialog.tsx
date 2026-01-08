'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, X, CalendarOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { toDateString, parseDateString } from '@/lib/utils/format'
import { createUnavailability } from '@/app/dashboard/availability/actions'

interface AddUnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unavailableDates: Date[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  onSuccess: () => void
}

// Get first day of current month
const getFirstDayOfCurrentMonth = (): Date => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function AddUnavailabilityDialog({
  open,
  onOpenChange,
  unavailableDates,
  weekStartsOn = 1,
  onSuccess,
}: AddUnavailabilityDialogProps) {
  const router = useRouter()
  const [showReasonForm, setShowReasonForm] = useState(false)
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Check if we can go to previous month
  const canGoPrevious = useMemo(() => {
    const firstOfCurrentMonth = getFirstDayOfCurrentMonth()
    const firstOfDisplayedMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    )
    return firstOfDisplayedMonth > firstOfCurrentMonth
  }, [calendarMonth])

  // Disable past days (before today)
  const disabledDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { before: today }
  }, [])

  // Selected range for calendar highlighting
  const selectedRange = useMemo(() => {
    if (!selectedStart || !selectedEnd) return []
    const dates: Date[] = []
    const current = new Date(selectedStart)
    current.setDate(current.getDate() + 1)
    while (current <= selectedEnd) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }, [selectedStart, selectedEnd])

  const handleDayClick = useCallback((day: Date) => {
    // Check if this date is already unavailable
    const dateStr = toDateString(day)
    const isExistingUnavailable = unavailableDates.some(
      (d) => toDateString(d) === dateStr
    )

    if (isExistingUnavailable) {
      // Navigate to availability page to edit
      router.push('/dashboard/availability')
      onOpenChange(false)
      return
    }

    if (!selectedStart) {
      setSelectedStart(day)
      setSelectedEnd(null)
    } else if (!selectedEnd) {
      if (day >= selectedStart) {
        setSelectedEnd(day)
        setShowReasonForm(true)
      } else {
        setSelectedStart(day)
        setSelectedEnd(null)
      }
    } else {
      setSelectedStart(day)
      setSelectedEnd(null)
      setShowReasonForm(false)
    }
  }, [selectedStart, selectedEnd, unavailableDates, router, onOpenChange])

  const handleAddSingleDay = useCallback(() => {
    if (selectedStart) {
      setSelectedEnd(selectedStart)
      setShowReasonForm(true)
    }
  }, [selectedStart])

  const handleClearSelection = useCallback(() => {
    setSelectedStart(null)
    setSelectedEnd(null)
    setShowReasonForm(false)
  }, [])

  const handlePrevMonth = useCallback(() => {
    const prevMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    )
    const firstOfCurrentMonth = getFirstDayOfCurrentMonth()
    if (prevMonth >= firstOfCurrentMonth) {
      setCalendarMonth(prevMonth)
    }
  }, [calendarMonth])

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      1
    )
    setCalendarMonth(nextMonth)
  }, [calendarMonth])

  const handleSave = useCallback(async () => {
    if (!selectedStart || !selectedEnd) return

    setIsSaving(true)
    const result = await createUnavailability({
      startDate: toDateString(selectedStart),
      endDate: toDateString(selectedEnd),
      reason: reason || undefined,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Unavailability added')
      onOpenChange(false)
      setSelectedStart(null)
      setSelectedEnd(null)
      setReason('')
      setShowReasonForm(false)
      onSuccess()
      router.refresh()
    }
    setIsSaving(false)
  }, [selectedStart, selectedEnd, reason, router, onOpenChange, onSuccess])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
    setSelectedStart(null)
    setSelectedEnd(null)
    setReason('')
    setShowReasonForm(false)
  }, [onOpenChange])

  const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Unavailability</DialogTitle>
        </DialogHeader>

        {!showReasonForm ? (
          // Calendar view
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Select dates when you are unavailable
            </p>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 !border !border-black dark:!border-white"
                onClick={handlePrevMonth}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm">{monthName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 !border !border-black dark:!border-white"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Calendar
              mode="single"
              month={calendarMonth}
              onMonthChange={() => {}}
              selected={undefined}
              onSelect={(day) => day && handleDayClick(day)}
              disabled={disabledDays}
              hideNavigation
              weekStartsOn={weekStartsOn}
              modifiers={{
                unavailable: unavailableDates,
                selectedStart: selectedStart ? [selectedStart] : [],
                selectedRange: selectedRange,
              }}
              modifiersClassNames={{
                unavailable:
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-lg',
                selectedStart:
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
                selectedRange:
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
              }}
              classNames={{
                caption_label: "hidden",
                month_caption: "hidden",
              }}
              className="rounded-md w-full [&_table]:w-full !p-0"
            />

            {/* Selection indicator */}
            {selectedStart && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Selected: </span>
                    <span>
                      {selectedStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Click another date for a range, or
                  </span>
                  <Button size="sm" className="w-full sm:w-auto text-xs h-7" onClick={handleAddSingleDay}>
                    Add Single Day
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Reason form view
          <div className="py-4">
            {selectedStart && selectedEnd && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-3">
                  <CalendarOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Marking as unavailable</span>
                </div>
                {toDateString(selectedStart) === toDateString(selectedEnd) ? (
                  <div className="flex justify-center">
                    <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                      <div className="text-xs text-muted-foreground uppercase">
                        {selectedStart.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-2xl font-bold">{selectedStart.getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                      <div className="text-xs text-muted-foreground uppercase">
                        {selectedStart.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-2xl font-bold">{selectedStart.getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-red-400" />
                    <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                      <div className="text-xs text-muted-foreground uppercase">
                        {selectedEnd.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-2xl font-bold">{selectedEnd.getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Vacation, Family event..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                autoFocus={false}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {showReasonForm ? (
            <>
              <Button
                variant="outline"
                className="rounded-full !border !border-black dark:!border-white"
                onClick={() => setShowReasonForm(false)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Add'}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="rounded-full !border !border-black dark:!border-white"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
