import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { parseISO, isAfter, isBefore, startOfDay, endOfDay, isPast } from 'date-fns'
import { getEventsForPicker } from '../../actions/events'
import type { EventForPicker, Campus } from './types'

interface UseEventPickerStateOptions {
  open: boolean
}

export function useEventPickerState({ open }: UseEventPickerStateOptions) {
  // Data state
  const [events, setEvents] = useState<EventForPicker[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [eventTypeFilters, setEventTypeFilters] = useState<string[]>([])
  const [campusFilters, setCampusFilters] = useState<string[]>([])
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [showPastEvents, setShowPastEvents] = useState(false)

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

      // Event type filter
      if (eventTypeFilters.length > 0 && !eventTypeFilters.includes(event.event_type)) {
        return false
      }

      // Campus filter
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

  const resetFilters = useCallback(() => {
    setSearch('')
    setEventTypeFilters([])
    setCampusFilters([])
    setDateFromFilter('')
    setDateToFilter('')
    setShowPastEvents(false)
  }, [])

  const toggleEventType = useCallback((type: string) => {
    setEventTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

  const toggleCampus = useCallback((campusId: string) => {
    setCampusFilters((prev) =>
      prev.includes(campusId) ? prev.filter((c) => c !== campusId) : [...prev, campusId]
    )
  }, [])

  const clearEventTypeFilters = useCallback(() => {
    setEventTypeFilters([])
  }, [])

  const clearCampusFilters = useCallback(() => {
    setCampusFilters([])
  }, [])

  return {
    // Data
    events,
    campuses,
    filteredEvents,
    isLoading,
    error,

    // Filter state
    search,
    setSearch,
    eventTypeFilters,
    campusFilters,
    dateFromFilter,
    setDateFromFilter,
    dateToFilter,
    setDateToFilter,
    showPastEvents,
    setShowPastEvents,

    // Actions
    resetFilters,
    toggleEventType,
    toggleCampus,
    clearEventTypeFilters,
    clearCampusFilters,
  }
}
