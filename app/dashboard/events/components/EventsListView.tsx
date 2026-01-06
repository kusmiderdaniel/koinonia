'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar, Plus, Search } from 'lucide-react'
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
  canManage?: boolean
  onCreateEvent?: () => void
  onDuplicateEvent?: (event: Event) => void
  onEditEvent?: (event: Event) => void
  onDeleteEvent?: (event: Event) => void
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
  canManage,
  onCreateEvent,
  onDuplicateEvent,
  onEditEvent,
  onDeleteEvent,
  className,
}: EventsListViewProps) {
  return (
    <div className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card overflow-hidden ${className ?? 'w-full md:w-80 md:flex-shrink-0'}`}>
      {/* Search + Add Button */}
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {canManage && onCreateEvent && (
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 rounded-full !border !border-black dark:!border-white"
            onClick={onCreateEvent}
            title="Create event"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
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
          </ToggleGroupItem>
          <ToggleGroupItem
            value="past"
            className="flex-1 rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
          >
            Past
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
                  canManage={canManage}
                  onDuplicate={onDuplicateEvent}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
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
                  canManage={canManage}
                  onDuplicate={onDuplicateEvent}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
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
        <div className="h-full flex flex-col">
          <MobileBackHeader
            title={listProps.selectedEvent.title}
            onBack={() => onClearSelection?.()}
          />
          <div className="flex-1 min-h-0">
            {detailContent}
          </div>
        </div>
      )
    }

    return (
      <div className="h-full">
        <EventsListView {...listProps} className="w-full h-full" />
      </div>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className="flex gap-6 h-full">
      <EventsListView {...listProps} className="w-80 flex-shrink-0 h-full" />
      <div className="flex-1 min-w-0 h-full">
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
