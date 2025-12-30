'use client'

import { useCallback } from 'react'
import { CalendarOff } from 'lucide-react'
import { useAvailabilityData, useCalendarSelection, useAvailabilityDialogs } from './hooks'
import { CalendarSection, UnavailabilityList, AddDialog, EditDialog } from './components'
import { toDateString } from './types'
import type { Unavailability } from './types'

export default function AvailabilityPage() {
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

  return (
    <div className="container max-w-5xl py-6">
      <div className="flex items-center gap-3 mb-6">
        <CalendarOff className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">My Unavailability</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Click on a date to mark it as unavailable. Click a second date to select a range. Click on
        an existing unavailable date to edit it.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <CalendarSection
          calendarMonth={calendar.calendarMonth}
          firstDayOfWeek={data.firstDayOfWeek}
          unavailableDates={data.unavailableDates}
          selectedStart={calendar.selectedStart}
          selectedEnd={calendar.selectedEnd}
          selectedRange={calendar.selectedRange}
          canGoPrevious={calendar.canGoPrevious}
          disabledDays={calendar.disabledDays}
          onDayClick={handleDayClick}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onClearSelection={handleClearSelection}
          onAddSingleDay={handleAddSingleDay}
        />

        {/* Unavailability List */}
        <UnavailabilityList
          isLoading={data.isLoading}
          unavailability={data.unavailability}
          upcomingItems={data.upcomingItems}
          pastItems={data.pastItems}
          activeTab={dialogs.activeTab}
          onTabChange={dialogs.setActiveTab}
          onEdit={dialogs.openEditDialog}
          onDelete={handleDelete}
        />
      </div>

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
    </div>
  )
}
