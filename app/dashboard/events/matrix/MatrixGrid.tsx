'use client'

import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import { MatrixCell } from './MatrixCell'
import { AvailabilitySection } from './AvailabilitySection'
import type { MatrixData, MatrixRow, MatrixEvent } from './types'

export interface AgendaCellClickData {
  eventId: string
  eventDate: string
  agendaItemId: string | null
  agendaIndex: number
  isSong: boolean
  isPlaceholder: boolean
  ministryId: string | null
  currentLeaderId: string | null
  // Song-specific data
  songTitle: string | null
  songKey: string | null
  leaderFirstName: string | null
  leaderLastName: string | null
  description: string | null
}

interface MatrixGridProps {
  data: MatrixData
  onAgendaCellClick?: (data: AgendaCellClickData) => void
  onPositionCellClick?: (eventId: string, positionId: string) => void
  onEventClick?: (eventId: string) => void
}

export function MatrixGrid({
  data,
  onAgendaCellClick,
  onPositionCellClick,
  onEventClick,
}: MatrixGridProps) {
  const { events, rows, unavailabilityByEvent, multiAssignmentsByEvent } = data

  return (
    <div className="relative h-full flex flex-col">
      {/* Matrix container - single scroll container with both directions */}
      <div className="flex-1 overflow-auto scrollbar-minimal">
        <div className="inline-flex min-w-full min-h-full">
          {/* Sticky sidebar */}
          <div className="flex-shrink-0 w-48 border-r bg-white dark:bg-zinc-950 sticky left-0 z-[5]">
            {/* Header */}
            <div className="h-16 border-b flex items-center px-3 bg-white dark:bg-zinc-950">
              <span className="text-sm font-medium text-muted-foreground">Agenda</span>
            </div>

            {/* Row labels */}
            {rows.map((row) => (
              <RowLabel key={row.key} row={row} />
            ))}

            {/* Availability header spacer */}
            <div className="min-h-[60px]" />
          </div>

          {/* Event columns */}
          {events.map((event) => (
            <EventColumn
              key={event.id}
              event={event}
              rows={rows}
              unavailability={unavailabilityByEvent[event.id] || []}
              multiAssignments={multiAssignmentsByEvent[event.id] || []}
              onEventClick={onEventClick}
              onAgendaCellClick={onAgendaCellClick}
              onPositionCellClick={onPositionCellClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Row label in the sidebar
function RowLabel({ row }: { row: MatrixRow }) {
  if (row.type === 'agenda-header') {
    return (
      <div className="h-8 flex items-center px-3 bg-white dark:bg-zinc-950 border-b">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {row.label}
        </span>
      </div>
    )
  }

  if (row.type === 'agenda-item') {
    return (
      <div className="h-12 flex items-center px-3 border-b bg-white dark:bg-zinc-950">
        <span className="text-sm text-muted-foreground">{row.label}</span>
      </div>
    )
  }

  if (row.type === 'ministry-header') {
    return (
      <div className="h-8 flex items-center px-3 bg-white dark:bg-zinc-950 border-b">
        <div
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: row.ministryColor }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide truncate">
          {row.label}
        </span>
      </div>
    )
  }

  if (row.type === 'position') {
    return (
      <div className="h-12 flex items-center px-3 border-b bg-white dark:bg-zinc-950">
        <span className="text-sm truncate">{row.label}</span>
      </div>
    )
  }

  if (row.type === 'availability-header') {
    return (
      <div className="h-8 flex items-center px-3 bg-white dark:bg-zinc-950 border-b">
        <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Availability
        </span>
      </div>
    )
  }

  return null
}

// Event column
interface EventColumnProps {
  event: MatrixEvent
  rows: MatrixRow[]
  unavailability: { profileId: string; firstName: string; lastName: string; reason: string | null }[]
  multiAssignments: { profileId: string; firstName: string; lastName: string; positions: string[] }[]
  onEventClick?: (eventId: string) => void
  onAgendaCellClick?: (data: AgendaCellClickData) => void
  onPositionCellClick?: (eventId: string, positionId: string) => void
}

function EventColumn({
  event,
  rows,
  unavailability,
  multiAssignments,
  onEventClick,
  onAgendaCellClick,
  onPositionCellClick,
}: EventColumnProps) {
  const eventDate = new Date(event.start_time)

  return (
    <div className="flex-shrink-0 w-44 border-r">
      {/* Event header */}
      <button
        className="w-full h-16 px-3 border-b bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-left"
        onClick={() => onEventClick?.(event.id)}
      >
        <div className="text-lg font-bold">{format(eventDate, 'dd/MM')}</div>
        <div className="text-xs text-muted-foreground truncate">{event.title}</div>
      </button>

      {/* Cells for each row */}
      {rows.map((row) => (
        <EventCell
          key={row.key}
          event={event}
          row={row}
          onAgendaCellClick={onAgendaCellClick}
          onPositionCellClick={onPositionCellClick}
        />
      ))}

      {/* Availability section */}
      <AvailabilitySection
        unavailability={unavailability}
        multiAssignments={multiAssignments}
      />
    </div>
  )
}

// Individual cell in an event column
interface EventCellProps {
  event: MatrixEvent
  row: MatrixRow
  onAgendaCellClick?: (data: AgendaCellClickData) => void
  onPositionCellClick?: (eventId: string, positionId: string) => void
}

function EventCell({ event, row, onAgendaCellClick, onPositionCellClick }: EventCellProps) {
  // Header rows are just spacers
  if (row.type === 'agenda-header' || row.type === 'ministry-header' || row.type === 'availability-header') {
    return <div className="h-8 border-b bg-white dark:bg-zinc-950" />
  }

  // Agenda item cell
  if (row.type === 'agenda-item' && row.agendaIndex !== undefined) {
    const agendaItem = event.agendaItems[row.agendaIndex]

    if (!agendaItem) {
      // This event doesn't have this agenda slot - show dash
      return (
        <div className="h-12 border-b p-1 flex items-center justify-center">
          <span className="text-muted-foreground">—</span>
        </div>
      )
    }

    return (
      <div className="h-12 border-b p-1">
        <MatrixCell
          type={agendaItem.isSong ? 'song' : 'agenda'}
          title={agendaItem.isSong ? (agendaItem.songTitle || agendaItem.title) : agendaItem.title}
          songKey={agendaItem.songKey}
          isPlaceholder={agendaItem.isPlaceholder}
          leaderName={agendaItem.leaderFirstName && agendaItem.leaderLastName
            ? `${agendaItem.leaderFirstName} ${agendaItem.leaderLastName}`
            : null}
          isEmpty={false}
          onClick={() => onAgendaCellClick?.({
            eventId: event.id,
            eventDate: event.start_time.split('T')[0],
            agendaItemId: agendaItem.agendaItemId,
            agendaIndex: row.agendaIndex!,
            isSong: agendaItem.isSong,
            isPlaceholder: agendaItem.isPlaceholder,
            ministryId: agendaItem.ministryId,
            currentLeaderId: agendaItem.leaderId,
            songTitle: agendaItem.songTitle || agendaItem.title,
            songKey: agendaItem.songKey,
            leaderFirstName: agendaItem.leaderFirstName,
            leaderLastName: agendaItem.leaderLastName,
            description: agendaItem.description,
          })}
        />
      </div>
    )
  }

  // Position cell
  if (row.type === 'position' && row.positionTitle && row.ministryId) {
    // Find the position in this event matching the row's ministry and title
    const ministryGroup = event.positionsByMinistry.find((g) => g.ministryId === row.ministryId)
    const position = ministryGroup?.positions.find((p) => p.title === row.positionTitle)

    if (!position) {
      // This event doesn't have this position - show dash
      return (
        <div className="h-12 border-b p-1 flex items-center justify-center">
          <span className="text-muted-foreground">—</span>
        </div>
      )
    }

    return (
      <div className="h-12 border-b p-1">
        <MatrixCell
          type="position"
          personName={position.assignment ? `${position.assignment.firstName} ${position.assignment.lastName}` : null}
          status={position.assignment?.status || null}
          isEmpty={!position.assignment}
          onClick={() => onPositionCellClick?.(event.id, position.positionId)}
        />
      </div>
    )
  }

  return <div className="h-12 border-b" />
}
