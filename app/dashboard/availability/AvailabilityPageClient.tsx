'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarOff } from 'lucide-react'
import { useAvailabilityData, useCalendarSelection, useAvailabilityDialogs } from './hooks'
import { CalendarSection, UnavailabilityList, AddDialog, EditDialog } from './components'
import { toDateString } from './types'
import type { Unavailability } from './types'

export function AvailabilityPageClient() {
  const t = useTranslations('availability')
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
      data.setError(t('errors.endDateBeforeStart'))
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
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">{t('descriptionDesktop')}</span>
              <span className="sm:hidden">{t('descriptionMobile')}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="border border-black dark:border-zinc-700 rounded-lg p-3 md:p-6 w-full lg:w-fit">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* Calendar Section */}
              <div className="w-full lg:w-[320px] pb-6 lg:pb-0 lg:pr-8 border-b lg:border-b-0 lg:border-r border-border">
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
              </div>

              {/* Unavailability List */}
              <div className="w-full lg:w-[320px]">
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
            </div>
          </div>
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
          firstDayOfWeek={data.firstDayOfWeek}
          onOpenChange={dialogs.setEditDialogOpen}
          onStartDateChange={dialogs.setEditStartDate}
          onEndDateChange={dialogs.setEditEndDate}
          onReasonChange={dialogs.setEditReason}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onCancel={handleEditCancel}
        />
      </div>
    </div>
  )
}
