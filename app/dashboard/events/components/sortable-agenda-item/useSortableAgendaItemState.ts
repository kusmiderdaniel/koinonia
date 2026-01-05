import { useState, useCallback } from 'react'
import { getMinistryMembersForAgenda } from '../../actions'
import type { AgendaItem, Member } from './types'

interface UseSortableAgendaItemStateOptions {
  item: AgendaItem
  onKeyChange: (itemId: string, key: string | null) => Promise<void>
  onLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  onDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  onDescriptionChange: (itemId: string, description: string | null) => Promise<void>
}

export function useSortableAgendaItemState({
  item,
  onKeyChange,
  onLeaderChange,
  onDurationChange,
  onDescriptionChange,
}: UseSortableAgendaItemStateOptions) {
  // Popover states
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false)
  const [leaderPopoverOpen, setLeaderPopoverOpen] = useState(false)
  const [durationPopoverOpen, setDurationPopoverOpen] = useState(false)
  const [descriptionPopoverOpen, setDescriptionPopoverOpen] = useState(false)

  // Edit states
  const [editMinutes, setEditMinutes] = useState('')
  const [editSeconds, setEditSeconds] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false)
  const [ministryMembers, setMinistryMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Key handlers
  const handleKeyChange = useCallback(async (key: string) => {
    setIsUpdating(true)
    await onKeyChange(item.id, key)
    setKeyPopoverOpen(false)
    setIsUpdating(false)
  }, [item.id, onKeyChange])

  // Leader handlers
  const handleLeaderChange = useCallback(async (leaderId: string | null) => {
    setIsUpdating(true)
    await onLeaderChange(item.id, leaderId)
    setLeaderPopoverOpen(false)
    setIsUpdating(false)
  }, [item.id, onLeaderChange])

  const handleLeaderPopoverOpen = useCallback(async (open: boolean) => {
    setLeaderPopoverOpen(open)
    if (open && item.ministry_id) {
      setIsLoadingMembers(true)
      const result = await getMinistryMembersForAgenda(item.ministry_id)
      if (result.data) {
        setMinistryMembers(result.data as Member[])
      }
      setIsLoadingMembers(false)
    }
  }, [item.ministry_id])

  // Duration handlers
  const handleDurationPopoverOpen = useCallback((open: boolean) => {
    if (open) {
      const mins = Math.floor(item.duration_seconds / 60)
      const secs = item.duration_seconds % 60
      setEditMinutes(mins.toString())
      setEditSeconds(secs.toString().padStart(2, '0'))
    }
    setDurationPopoverOpen(open)
  }, [item.duration_seconds])

  const handleDurationSave = useCallback(async () => {
    const mins = parseInt(editMinutes, 10) || 0
    const secs = parseInt(editSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs
    if (totalSeconds > 0) {
      setIsUpdating(true)
      await onDurationChange(item.id, totalSeconds)
      setDurationPopoverOpen(false)
      setIsUpdating(false)
    }
  }, [editMinutes, editSeconds, item.id, onDurationChange])

  const handleMinutesInput = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setEditMinutes(cleaned)
    }
  }, [])

  const handleSecondsInput = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setEditSeconds(cleaned)
      }
    }
  }, [])

  // Description handlers
  const handleDescriptionPopoverOpen = useCallback((open: boolean) => {
    if (open) {
      setEditDescription(item.description || '')
    }
    setDescriptionPopoverOpen(open)
  }, [item.description])

  const handleDescriptionSave = useCallback(async () => {
    setIsUpdating(true)
    await onDescriptionChange(item.id, editDescription.trim() || null)
    setDescriptionPopoverOpen(false)
    setIsUpdating(false)
  }, [editDescription, item.id, onDescriptionChange])

  const handleClearDescription = useCallback(() => {
    setEditDescription('')
  }, [])

  return {
    // Popover states
    keyPopoverOpen,
    setKeyPopoverOpen,
    leaderPopoverOpen,
    durationPopoverOpen,
    descriptionPopoverOpen,

    // Edit states
    editMinutes,
    editSeconds,
    editDescription,
    setEditDescription,

    // Loading states
    isUpdating,
    ministryMembers,
    isLoadingMembers,

    // Handlers
    handleKeyChange,
    handleLeaderChange,
    handleLeaderPopoverOpen,
    handleDurationPopoverOpen,
    handleDurationSave,
    handleMinutesInput,
    handleSecondsInput,
    handleDescriptionPopoverOpen,
    handleDescriptionSave,
    handleClearDescription,
  }
}
