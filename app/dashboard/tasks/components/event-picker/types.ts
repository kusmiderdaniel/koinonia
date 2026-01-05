import type { EventForPicker, Campus } from '../../actions/events'

export type { EventForPicker, Campus }

export interface EventPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEventId: string | null
  onSelect: (eventId: string | null) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface EventPickerFilterState {
  search: string
  eventTypeFilters: string[]
  campusFilters: string[]
  dateFromFilter: string
  dateToFilter: string
  showPastEvents: boolean
}

export interface EventPickerState {
  events: EventForPicker[]
  campuses: Campus[]
  isLoading: boolean
  error: string | null
  filters: EventPickerFilterState
  filteredEvents: EventForPicker[]
}
