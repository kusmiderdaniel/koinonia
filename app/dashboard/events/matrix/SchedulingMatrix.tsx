'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MatrixFilters } from './MatrixFilters'
import { MatrixGrid, type AgendaCellClickData } from './MatrixGrid'
import { MatrixLegend } from './MatrixLegend'
import { MatrixInvitationsDialog } from './matrix-invitations-dialog'
import { getMatrixData, getMatrixMinistries, getMatrixCampuses } from '../actions/matrix-queries'
import type { MatrixFilters as MatrixFiltersType, MatrixData, MatrixMinistry, MatrixCampus } from './types'

interface SongEditorData {
  agendaItemId: string
  songTitle: string
  currentKey: string | null
  currentLeaderId: string | null
  currentLeaderName: string | null
  currentDescription: string | null
  ministryId: string | null
  eventId: string
  eventDate: string
}

interface SchedulingMatrixProps {
  onEventSelect?: (eventId: string) => void
  onOpenSongPicker?: (eventId: string, agendaItemId: string | null, slotIndex: number) => void
  onOpenVolunteerPicker?: (eventId: string, positionId: string) => void
  onOpenLeaderPicker?: (agendaItemId: string, ministryId: string, currentLeaderId: string | null, eventDate: string) => void
  onOpenSongEditor?: (data: SongEditorData) => void
}

export function SchedulingMatrix({
  onEventSelect,
  onOpenSongPicker,
  onOpenVolunteerPicker,
  onOpenLeaderPicker,
  onOpenSongEditor,
}: SchedulingMatrixProps) {
  const queryClient = useQueryClient()

  // Filter state
  const [filters, setFilters] = useState<MatrixFiltersType>({
    campusId: null,
    ministryIds: [],
    eventType: null,
  })

  // Invitations dialog state
  const [invitationsDialogOpen, setInvitationsDialogOpen] = useState(false)

  // Fetch ministries and campuses for filter dropdowns
  const { data: ministries = [] } = useQuery<MatrixMinistry[]>({
    queryKey: ['matrix-ministries'],
    queryFn: async () => {
      const result = await getMatrixMinistries()
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: campuses = [] } = useQuery<MatrixCampus[]>({
    queryKey: ['matrix-campuses'],
    queryFn: async () => {
      const result = await getMatrixCampuses()
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch matrix data - show next 20 events
  const {
    data: matrixData,
    isLoading,
    error,
    refetch,
  } = useQuery<MatrixData>({
    queryKey: ['matrix-data', filters],
    queryFn: async () => {
      const result = await getMatrixData({ filters, limit: 20 })
      if (result.error) throw new Error(result.error)
      return result.data!
    },
    staleTime: 30 * 1000,
  })

  // Filter handlers
  const handleCampusChange = useCallback((campusId: string | null) => {
    setFilters((prev) => ({ ...prev, campusId }))
  }, [])

  const handleMinistriesChange = useCallback((ministryIds: string[]) => {
    setFilters((prev) => ({ ...prev, ministryIds }))
  }, [])

  const handleEventTypeChange = useCallback((eventType: string | null) => {
    setFilters((prev) => ({ ...prev, eventType }))
  }, [])

  // Cell click handlers
  const handleAgendaCellClick = useCallback((data: AgendaCellClickData) => {
    const {
      eventId,
      eventDate,
      agendaItemId,
      agendaIndex,
      isSong,
      isPlaceholder,
      ministryId,
      currentLeaderId,
      songTitle,
      songKey,
      leaderFirstName,
      leaderLastName,
      description,
    } = data

    if (isSong) {
      if (isPlaceholder || !agendaItemId) {
        // Open song picker for placeholder songs (empty slots)
        onOpenSongPicker?.(eventId, agendaItemId, agendaIndex)
      } else {
        // Open song editor for filled songs
        const leaderName = leaderFirstName && leaderLastName
          ? `${leaderFirstName} ${leaderLastName}`
          : null
        onOpenSongEditor?.({
          agendaItemId,
          songTitle: songTitle || 'Song',
          currentKey: songKey,
          currentLeaderId,
          currentLeaderName: leaderName,
          currentDescription: description,
          ministryId,
          eventId,
          eventDate,
        })
      }
    } else if (agendaItemId && ministryId) {
      // Open leader picker for non-song agenda items that have a ministry
      onOpenLeaderPicker?.(agendaItemId, ministryId, currentLeaderId, eventDate)
    }
  }, [onOpenSongPicker, onOpenLeaderPicker, onOpenSongEditor])

  const handlePositionCellClick = useCallback((eventId: string, positionId: string) => {
    onOpenVolunteerPicker?.(eventId, positionId)
  }, [onOpenVolunteerPicker])

  const handleEventClick = useCallback((eventId: string) => {
    onEventSelect?.(eventId)
  }, [onEventSelect])

  // Get event IDs for invitations dialog
  const eventIds = useMemo(() => {
    return matrixData?.events.map((e) => e.id) || []
  }, [matrixData])

  // Handle invitations success - refresh matrix data
  const handleInvitationsSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load scheduling matrix</p>
      </div>
    )
  }

  const hasEvents = matrixData && matrixData.events.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Filters and Actions */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <MatrixFilters
          campuses={campuses}
          ministries={ministries}
          selectedCampusId={filters.campusId}
          selectedMinistryIds={filters.ministryIds}
          selectedEventType={filters.eventType}
          onCampusChange={handleCampusChange}
          onMinistriesChange={handleMinistriesChange}
          onEventTypeChange={handleEventTypeChange}
        />

        {/* Send Invitations Button */}
        {hasEvents && (
          <Button
            variant="outline"
            className="rounded-full border-gray-900 dark:border-zinc-300 shrink-0"
            onClick={() => setInvitationsDialogOpen(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invitations
          </Button>
        )}
      </div>

      {/* Matrix Grid + Legend */}
      <div className="flex-1 flex flex-col overflow-hidden border rounded-lg">
        {hasEvents ? (
          <div className="flex-1 overflow-hidden">
            <MatrixGrid
              data={matrixData}
              onAgendaCellClick={handleAgendaCellClick}
              onPositionCellClick={handlePositionCellClick}
              onEventClick={handleEventClick}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No upcoming events found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or create new events
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        <MatrixLegend />
      </div>

      {/* Invitations Dialog */}
      <MatrixInvitationsDialog
        open={invitationsDialogOpen}
        onOpenChange={setInvitationsDialogOpen}
        eventIds={eventIds}
        onSuccess={handleInvitationsSuccess}
      />
    </div>
  )
}
