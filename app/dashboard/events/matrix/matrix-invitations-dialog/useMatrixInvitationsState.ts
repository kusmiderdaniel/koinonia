import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  sendBulkInvitations,
  getMatrixPendingInvitationCounts,
} from '../../actions/invitations'
import type { BulkInvitationScope, PendingCounts } from './types'

interface UseMatrixInvitationsStateOptions {
  open: boolean
  eventIds: string[]
  onSuccess: () => void
  onOpenChange: (open: boolean) => void
}

export function useMatrixInvitationsState({
  open,
  eventIds,
  onSuccess,
  onOpenChange,
}: UseMatrixInvitationsStateOptions) {
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const [scope, setScope] = useState<BulkInvitationScope>('all')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([])
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  // Fetch pending counts when dialog opens
  useEffect(() => {
    if (open && eventIds.length > 0) {
      setIsLoadingCounts(true)
      setScope('all')
      setSelectedDates([])
      setSelectedEventIds([])
      setSelectedMinistryIds([])
      setSelectedPositionIds([])

      getMatrixPendingInvitationCounts(eventIds).then((result) => {
        if (result.data) {
          setPendingCounts(result.data)
        }
        setIsLoadingCounts(false)
      })
    }
  }, [open, eventIds])

  const handleSend = useCallback(async () => {
    setIsSending(true)

    try {
      const options = {
        eventIds,
        scope,
        selectedDates: scope === 'dates' ? selectedDates : undefined,
        selectedEventIds: scope === 'events' ? selectedEventIds : undefined,
        selectedMinistryIds: scope === 'ministries' ? selectedMinistryIds : undefined,
        selectedPositionIds: scope === 'positions' ? selectedPositionIds : undefined,
      }

      const result = await sendBulkInvitations(options)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.data?.invitedCount} invitation(s) sent!`)
        onSuccess()
        onOpenChange(false)
      }
    } catch {
      toast.error('Failed to send invitations')
    } finally {
      setIsSending(false)
    }
  }, [eventIds, scope, selectedDates, selectedEventIds, selectedMinistryIds, selectedPositionIds, onSuccess, onOpenChange])

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    )
  }, [])

  const toggleEvent = useCallback((eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    )
  }, [])

  const toggleMinistry = useCallback((ministryId: string) => {
    setSelectedMinistryIds((prev) =>
      prev.includes(ministryId)
        ? prev.filter((id) => id !== ministryId)
        : [...prev, ministryId]
    )
  }, [])

  const togglePosition = useCallback((positionId: string) => {
    setSelectedPositionIds((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    )
  }, [])

  const getInviteCount = useCallback(() => {
    if (!pendingCounts) return 0

    if (scope === 'all') {
      return pendingCounts.total
    } else if (scope === 'dates' && selectedDates.length > 0) {
      return pendingCounts.byDate
        .filter((d) => selectedDates.includes(d.date))
        .reduce((sum, d) => sum + d.count, 0)
    } else if (scope === 'events' && selectedEventIds.length > 0) {
      return pendingCounts.byEvent
        .filter((e) => selectedEventIds.includes(e.event.id))
        .reduce((sum, e) => sum + e.count, 0)
    } else if (scope === 'ministries' && selectedMinistryIds.length > 0) {
      return pendingCounts.byMinistry
        .filter((m) => selectedMinistryIds.includes(m.ministry.id))
        .reduce((sum, m) => sum + m.count, 0)
    } else if (scope === 'positions' && selectedPositionIds.length > 0) {
      return pendingCounts.byPosition
        .filter((p) => selectedPositionIds.includes(p.position.id))
        .reduce((sum, p) => sum + p.count, 0)
    }
    return 0
  }, [pendingCounts, scope, selectedDates, selectedEventIds, selectedMinistryIds, selectedPositionIds])

  const canSend = useCallback(() => {
    if (!pendingCounts || pendingCounts.total === 0) return false

    if (scope === 'all') return true
    if (scope === 'dates') return selectedDates.length > 0
    if (scope === 'events') return selectedEventIds.length > 0
    if (scope === 'ministries') return selectedMinistryIds.length > 0
    if (scope === 'positions') return selectedPositionIds.length > 0

    return false
  }, [pendingCounts, scope, selectedDates, selectedEventIds, selectedMinistryIds, selectedPositionIds])

  return {
    // State
    pendingCounts,
    isLoadingCounts,
    scope,
    selectedDates,
    selectedEventIds,
    selectedMinistryIds,
    selectedPositionIds,
    isSending,

    // Computed
    inviteCount: getInviteCount(),
    canSend: canSend(),

    // Actions
    setScope,
    handleSend,
    toggleDate,
    toggleEvent,
    toggleMinistry,
    togglePosition,
  }
}
