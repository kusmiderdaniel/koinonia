'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, X, Calendar, ChevronDown } from 'lucide-react'
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, isPast } from 'date-fns'
import { SmartVirtualizedList } from '@/components/VirtualizedList'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { EVENT_TYPE_LABELS } from '@/lib/constants/event'
import { DatePicker } from '@/components/ui/date-picker'
import { getEventsForPicker, type EventForPicker, type Campus } from '../actions/events'

interface EventPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEventId: string | null
  onSelect: (eventId: string | null) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function EventPicker({
  open,
  onOpenChange,
  currentEventId,
  onSelect,
  weekStartsOn = 0,
}: EventPickerProps) {
  const [events, setEvents] = useState<EventForPicker[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states - now arrays for multiselect
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [eventTypeFilters, setEventTypeFilters] = useState<string[]>([])
  const [campusFilters, setCampusFilters] = useState<string[]>([])
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [showPastEvents, setShowPastEvents] = useState(false)

  // Popover states
  const [eventTypePopoverOpen, setEventTypePopoverOpen] = useState(false)
  const [campusPopoverOpen, setCampusPopoverOpen] = useState(false)

  // Fetch events when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setError(null)
      getEventsForPicker().then((result) => {
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setEvents(result.data.events)
          setCampuses(result.data.campuses)
        }
        setIsLoading(false)
      })
    }
  }, [open])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Hide past events by default (unless showPastEvents is true)
      if (!showPastEvents) {
        const eventDate = parseISO(event.start_time)
        if (isPast(eventDate)) {
          return false
        }
      }

      // Search filter
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase()
        if (!event.title.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Event type filter (multiselect - show if any selected type matches, or all if none selected)
      if (eventTypeFilters.length > 0 && !eventTypeFilters.includes(event.event_type)) {
        return false
      }

      // Campus filter (multiselect - show if any selected campus matches, or all if none selected)
      if (campusFilters.length > 0) {
        const hasCampus = event.campuses.some((c) => campusFilters.includes(c.id))
        if (!hasCampus) {
          return false
        }
      }

      // Date from filter
      if (dateFromFilter) {
        const eventDate = parseISO(event.start_time)
        const fromDate = startOfDay(parseISO(dateFromFilter))
        if (isBefore(eventDate, fromDate)) {
          return false
        }
      }

      // Date to filter
      if (dateToFilter) {
        const eventDate = parseISO(event.start_time)
        const toDate = endOfDay(parseISO(dateToFilter))
        if (isAfter(eventDate, toDate)) {
          return false
        }
      }

      return true
    })
  }, [events, debouncedSearch, eventTypeFilters, campusFilters, dateFromFilter, dateToFilter, showPastEvents])

  const handleSelect = (eventId: string | null) => {
    onSelect(eventId)
    onOpenChange(false)
    resetFilters()
  }

  const resetFilters = () => {
    setSearch('')
    setEventTypeFilters([])
    setCampusFilters([])
    setDateFromFilter('')
    setDateToFilter('')
    setShowPastEvents(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetFilters()
    }
    onOpenChange(isOpen)
  }

  const formatEventDate = (startTime: string) => {
    return format(parseISO(startTime), 'MMM d, yyyy · h:mm a')
  }

  const toggleEventType = (type: string) => {
    setEventTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleCampus = (campusId: string) => {
    setCampusFilters((prev) =>
      prev.includes(campusId) ? prev.filter((c) => c !== campusId) : [...prev, campusId]
    )
  }

  const getEventTypeLabel = () => {
    if (eventTypeFilters.length === 0) return 'All Types'
    if (eventTypeFilters.length === 1) return EVENT_TYPE_LABELS[eventTypeFilters[0]] || eventTypeFilters[0]
    return `${eventTypeFilters.length} types`
  }

  const getCampusLabel = () => {
    if (campusFilters.length === 0) return 'All Campuses'
    if (campusFilters.length === 1) {
      const campus = campuses.find((c) => c.id === campusFilters[0])
      return campus?.name || 'Campus'
    }
    return `${campusFilters.length} campuses`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Link to Event</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select an event to link to this task
          </p>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Event Type Filter - Multiselect */}
          <Popover open={eventTypePopoverOpen} onOpenChange={setEventTypePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between !bg-white dark:!bg-zinc-950 text-sm !border !border-input rounded-full hover:!bg-gray-100 dark:hover:!bg-zinc-800 transition-colors font-normal"
              >
                <span className="truncate">{getEventTypeLabel()}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-white dark:bg-zinc-950 border border-input" align="start">
              <div className="space-y-1">
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Checkbox
                      checked={eventTypeFilters.includes(value)}
                      onCheckedChange={() => toggleEventType(value)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {eventTypeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => setEventTypeFilters([])}
                >
                  Clear selection
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Campus Filter - Multiselect */}
          <Popover open={campusPopoverOpen} onOpenChange={setCampusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between !bg-white dark:!bg-zinc-950 text-sm !border !border-input rounded-full hover:!bg-gray-100 dark:hover:!bg-zinc-800 transition-colors font-normal"
              >
                <span className="truncate">{getCampusLabel()}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-white dark:bg-zinc-950 border border-input" align="start">
              <div className="space-y-1">
                {campuses.map((campus) => (
                  <label
                    key={campus.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Checkbox
                      checked={campusFilters.includes(campus.id)}
                      onCheckedChange={() => toggleCampus(campus.id)}
                    />
                    <span className="flex items-center gap-2 text-sm">
                      {campus.color && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: campus.color }}
                        />
                      )}
                      {campus.name}
                    </span>
                  </label>
                ))}
              </div>
              {campusFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => setCampusFilters([])}
                >
                  Clear selection
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <DatePicker
              value={dateFromFilter}
              onChange={(v) => setDateFromFilter(v || '')}
              placeholder="Start date"
              className="h-9 text-sm"
              weekStartsOn={weekStartsOn}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <DatePicker
              value={dateToFilter}
              onChange={(v) => setDateToFilter(v || '')}
              placeholder="End date"
              className="h-9 text-sm"
              weekStartsOn={weekStartsOn}
            />
          </div>
        </div>

        {/* Show Past Events Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={showPastEvents}
            onCheckedChange={(checked) => setShowPastEvents(checked === true)}
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
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading events...
          </p>
        ) : (
          <SmartVirtualizedList
            items={filteredEvents}
            estimateSize={80}
            className="max-h-[300px] -mx-4 px-4"
            virtualizationThreshold={30}
            emptyMessage={
              <p className="text-sm text-muted-foreground text-center py-4">
                {events.length === 0
                  ? 'No events found'
                  : 'No events match your filters'}
              </p>
            }
            renderItem={(event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => handleSelect(event.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  event.id === currentEventId
                    ? 'bg-brand/10 border-brand'
                    : 'border-input hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{event.title}</span>
                      <EventTypeBadge type={event.event_type} />
                      {event.id === currentEventId && (
                        <span className="text-xs text-brand">(Current)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatEventDate(event.start_time)}
                    </div>
                  </div>
                  {event.campuses.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {event.campuses.map((campus) => (
                        <span
                          key={campus.id}
                          className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800"
                          style={campus.color ? {
                            backgroundColor: `${campus.color}20`,
                            color: campus.color
                          } : undefined}
                        >
                          {campus.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
