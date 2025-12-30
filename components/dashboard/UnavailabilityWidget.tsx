'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarOff, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useAvailabilityData, useCalendarSelection, useAvailabilityDialogs } from '@/app/dashboard/availability/hooks'
import { AddDialog, EditDialog } from '@/app/dashboard/availability/components'
import { toDateString, formatDateRange } from '@/app/dashboard/availability/types'
import type { Unavailability } from '@/app/dashboard/availability/types'

export function UnavailabilityWidget() {
  const data = useAvailabilityData()
  const calendar = useCalendarSelection()
  const dialogs = useAvailabilityDialogs()

  // Handle calendar day click
  const handleDayClick = useCallback((day: Date) => {
    calendar.handleDayClick(
      day,
      data.unavailability,
      (item: Unavailability) => {
        dialogs.openEditDialog(item)
        calendar.setSelectedStart(null)
        calendar.setSelectedEnd(null)
      },
      () => dialogs.openAddDialog()
    )
  }, [calendar, data.unavailability, dialogs])

  // Handle adding single day
  const handleAddSingleDay = useCallback(() => {
    calendar.handleAddSingleDay(() => dialogs.openAddDialog())
  }, [calendar, dialogs])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    calendar.handleClearSelection()
    data.setError('')
  }, [calendar, data])

  // Save unavailability
  const handleSave = useCallback(async () => {
    if (!calendar.selectedStart || !calendar.selectedEnd) return

    const result = await data.createEntry({
      startDate: toDateString(calendar.selectedStart),
      endDate: toDateString(calendar.selectedEnd),
      reason: dialogs.reason || undefined,
    })

    if (!result.error) {
      dialogs.closeAddDialog()
      calendar.setSelectedStart(null)
      calendar.setSelectedEnd(null)
    }
  }, [calendar, data, dialogs])

  // Save edit
  const handleSaveEdit = useCallback(async () => {
    if (!dialogs.editingId || !dialogs.editStartDate || !dialogs.editEndDate) return

    if (dialogs.editEndDate < dialogs.editStartDate) {
      data.setError('End date must be on or after start date')
      return
    }

    const result = await data.updateEntry(dialogs.editingId, {
      startDate: dialogs.editStartDate,
      endDate: dialogs.editEndDate,
      reason: dialogs.editReason || undefined,
    })

    if (!result.error) {
      dialogs.closeEditDialog()
    }
  }, [data, dialogs])

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    const result = await data.deleteEntry(id)
    if (result.success) {
      dialogs.closeEditDialog()
    }
  }, [data, dialogs])

  // Handle month navigation
  const handlePrevMonth = useCallback(() => {
    const prevMonth = new Date(
      calendar.calendarMonth.getFullYear(),
      calendar.calendarMonth.getMonth() - 1,
      1
    )
    calendar.handleMonthChange(prevMonth)
  }, [calendar])

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(
      calendar.calendarMonth.getFullYear(),
      calendar.calendarMonth.getMonth() + 1,
      1
    )
    calendar.handleMonthChange(nextMonth)
  }, [calendar])

  // Cancel handlers
  const handleAddCancel = useCallback(() => {
    dialogs.closeAddDialog()
    calendar.setSelectedStart(null)
    calendar.setSelectedEnd(null)
  }, [dialogs, calendar])

  const handleEditCancel = useCallback(() => {
    dialogs.closeEditDialog()
    data.setError('')
  }, [dialogs, data])

  const monthName = calendar.calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarOff className="h-4 w-4" />
            My Unavailability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 !border !border-gray-300 dark:!border-gray-600"
              onClick={handlePrevMonth}
              disabled={!calendar.canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">{monthName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 !border !border-gray-300 dark:!border-gray-600"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            month={calendar.calendarMonth}
            onMonthChange={() => {}}
            selected={undefined}
            onSelect={(day) => day && handleDayClick(day)}
            disabled={calendar.disabledDays}
            hideNavigation
            weekStartsOn={data.firstDayOfWeek}
            modifiers={{
              unavailable: data.unavailableDates,
              selectedStart: calendar.selectedStart ? [calendar.selectedStart] : [],
              selectedRange: calendar.selectedRange,
            }}
            modifiersClassNames={{
              unavailable:
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-lg',
              selectedStart:
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
              selectedRange:
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
            }}
            className="rounded-md w-full [&_table]:w-full"
          />

          {/* Selection indicator */}
          {calendar.selectedStart && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Selected: </span>
                  {calendar.selectedEnd ? (
                    <span>
                      {calendar.selectedStart.toLocaleDateString()} - {calendar.selectedEnd.toLocaleDateString()}
                    </span>
                  ) : (
                    <span>{calendar.selectedStart.toLocaleDateString()}</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearSelection}>
                  <span className="sr-only">Clear</span>
                  ×
                </Button>
              </div>

              {!calendar.selectedEnd && (
                <div className="mt-2">
                  <Button size="sm" onClick={handleAddSingleDay} className="w-full">
                    Add Single Day
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Unavailability list */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Upcoming</h4>
            {data.upcomingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming unavailability
              </p>
            ) : (
              <div className="space-y-2">
                {data.upcomingItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {formatDateRange(item.start_date, item.end_date)}
                      </div>
                      {item.reason && (
                        <div className="text-xs text-muted-foreground truncate">{item.reason}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dialogs.openEditDialog(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Unavailability Dialog */}
      <AddDialog
        open={dialogs.addDialogOpen}
        selectedStart={calendar.selectedStart}
        selectedEnd={calendar.selectedEnd}
        reason={dialogs.reason}
        error={data.error}
        isSaving={data.isSaving}
        onOpenChange={dialogs.setAddDialogOpen}
        onReasonChange={dialogs.setReason}
        onSave={handleSave}
        onCancel={handleAddCancel}
      />

      {/* Edit Unavailability Dialog */}
      <EditDialog
        open={dialogs.editDialogOpen}
        editingId={dialogs.editingId}
        startDate={dialogs.editStartDate}
        endDate={dialogs.editEndDate}
        reason={dialogs.editReason}
        error={data.error}
        isSaving={data.isSaving}
        onOpenChange={dialogs.setEditDialogOpen}
        onStartDateChange={dialogs.setEditStartDate}
        onEndDateChange={dialogs.setEditEndDate}
        onReasonChange={dialogs.setEditReason}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        onCancel={handleEditCancel}
      />
    </>
  )
}
