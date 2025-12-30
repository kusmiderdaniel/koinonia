'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar, Search } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { useIsMobile } from '@/lib/hooks'
import { EventCard } from './EventCard'
import type { Event, EventDetail } from '../types'

interface EventsListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  listFilter: 'upcoming' | 'past'
  onListFilterChange: (filter: 'upcoming' | 'past') => void
  upcomingEvents: Event[]
  pastEvents: Event[]
  selectedEvent: EventDetail | null
  onSelectEvent: (event: Event) => void
  className?: string
}

export function EventsListView({
  searchQuery,
  onSearchChange,
  listFilter,
  onListFilterChange,
  upcomingEvents,
  pastEvents,
  selectedEvent,
  onSelectEvent,
  className,
}: EventsListViewProps) {
  return (
    <div className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card ${className ?? 'w-full md:w-80 md:flex-shrink-0'}`}>
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Upcoming/Past Toggle */}
      <div className="p-2 border-b">
        <ToggleGroup
          type="single"
          value={listFilter}
          onValueChange={(value) => value && onListFilterChange(value as 'upcoming' | 'past')}
          className="w-full"
        >
          <ToggleGroupItem
            value="upcoming"
            className="flex-1 rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
          >
            Upcoming
            {upcomingEvents.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({upcomingEvents.length})</span>
            )}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="past"
            className="flex-1 rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
          >
            Past
            {pastEvents.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({pastEvents.length})</span>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-2">
        {listFilter === 'upcoming' ? (
          upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => onSelectEvent(event)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              size="sm"
            />
          )
        ) : (
          pastEvents.length > 0 ? (
            <div className="space-y-2">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => onSelectEvent(event)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No past events"
              size="sm"
            />
          )
        )}
      </div>
    </div>
  )
}

interface EventsListViewWithDetailProps extends EventsListViewProps {
  detailContent: React.ReactNode
  emptyDetailContent: React.ReactNode
  onClearSelection?: () => void
}

export function EventsListViewWithDetail({
  detailContent,
  emptyDetailContent,
  onClearSelection,
  ...listProps
}: EventsListViewWithDetailProps) {
  const isMobile = useIsMobile()

  // Mobile: Show stacked view - list OR detail
  if (isMobile) {
    if (listProps.selectedEvent) {
      return (
        <div className="h-[calc(100vh-140px)]">
          <MobileBackHeader
            title={listProps.selectedEvent.title}
            onBack={() => onClearSelection?.()}
          />
          {detailContent}
        </div>
      )
    }

    return (
      <div className="h-[calc(100vh-140px)]">
        <EventsListView {...listProps} className="w-full h-full" />
      </div>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <EventsListView {...listProps} />
      <div className="flex-1 min-w-0">
        {listProps.selectedEvent ? (
          detailContent
        ) : (
          <Card className="h-full flex items-center justify-center">
            {emptyDetailContent}
          </Card>
        )}
      </div>
    </div>
  )
}
