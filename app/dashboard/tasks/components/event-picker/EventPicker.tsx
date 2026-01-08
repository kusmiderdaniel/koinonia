'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { useEventPickerState } from './useEventPickerState'
import { EventTypeFilter, CampusFilter } from './EventPickerFilters'
import { EventPickerItem } from './EventPickerItem'
import type { EventPickerProps } from './types'

export function EventPicker({
  open,
  onOpenChange,
  currentEventId,
  onSelect,
  weekStartsOn = 0,
  timeFormat,
}: EventPickerProps) {
  const state = useEventPickerState({ open })

  const handleSelect = useCallback((eventId: string | null) => {
    onSelect(eventId)
    onOpenChange(false)
    state.resetFilters()
  }, [onSelect, onOpenChange, state])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      state.resetFilters()
    }
    onOpenChange(isOpen)
  }, [onOpenChange, state])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Link to Event</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select an event to link to this task
          </p>
        </DialogHeader>

        {state.error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {state.error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={state.search}
            onChange={(e) => state.setSearch(e.target.value)}
            className="pl-9"
            autoFocus={false}
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-2">
          <EventTypeFilter
            selectedTypes={state.eventTypeFilters}
            onToggle={state.toggleEventType}
            onClear={state.clearEventTypeFilters}
          />
          <CampusFilter
            campuses={state.campuses}
            selectedCampuses={state.campusFilters}
            onToggle={state.toggleCampus}
            onClear={state.clearCampusFilters}
          />
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <DatePicker
              value={state.dateFromFilter}
              onChange={(v) => state.setDateFromFilter(v || '')}
              placeholder="Start date"
              className="h-9 text-sm"
              weekStartsOn={weekStartsOn}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <DatePicker
              value={state.dateToFilter}
              onChange={(v) => state.setDateToFilter(v || '')}
              placeholder="End date"
              className="h-9 text-sm"
              weekStartsOn={weekStartsOn}
            />
          </div>
        </div>

        {/* Show Past Events Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={state.showPastEvents}
            onCheckedChange={(checked) => state.setShowPastEvents(checked === true)}
          />
          <span className="text-sm text-muted-foreground">Show past events</span>
        </label>

        {/* Unlink option */}
        {currentEventId && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <X className="h-4 w-4" />
              <span>Remove event link</span>
            </div>
          </button>
        )}

        {/* Event List */}
        {state.isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading events...
          </p>
        ) : state.filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {state.events.length === 0
              ? 'No events found'
              : 'No events match your filters'}
          </p>
        ) : (
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '200px' }}>
            <div className="space-y-2">
              {state.filteredEvents.map((event) => (
                <EventPickerItem
                  key={event.id}
                  event={event}
                  isSelected={event.id === currentEventId}
                  onSelect={handleSelect}
                  timeFormat={timeFormat}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline-pill" className="!border !border-black dark:!border-white" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
