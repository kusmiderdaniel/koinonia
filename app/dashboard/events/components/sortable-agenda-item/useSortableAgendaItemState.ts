import { useState, useCallback } from 'react'
import { getMinistryMembersForAgenda } from '../../actions'
import { getArrangementsForSong } from '../../actions/agenda/songs'
import type { AgendaItem, Member } from './types'
import type { ArrangementOption } from './AgendaItemPopovers'

interface UseSortableAgendaItemStateOptions {
  item: AgendaItem
  onKeyChange: (itemId: string, key: string | null) => Promise<void>
  onLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  onDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  onDescriptionChange: (itemId: string, description: string | null) => Promise<void>
  onArrangementChange: (itemId: string, arrangementId: string | null) => Promise<void>
}

export function useSortableAgendaItemState({
  item,
  onKeyChange,
  onLeaderChange,
  onDurationChange,
  onDescriptionChange,
  onArrangementChange,
}: UseSortableAgendaItemStateOptions) {
  // Popover states
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false)
  const [leaderPopoverOpen, setLeaderPopoverOpen] = useState(false)
  const [durationPopoverOpen, setDurationPopoverOpen] = useState(false)
  const [descriptionPopoverOpen, setDescriptionPopoverOpen] = useState(false)
  const [arrangementPopoverOpen, setArrangementPopoverOpen] = useState(false)

  // Edit states
  const [editMinutes, setEditMinutes] = useState('')
  const [editSeconds, setEditSeconds] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false)
  const [ministryMembers, setMinistryMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [arrangements, setArrangements] = useState<ArrangementOption[]>([])
  const [isLoadingArrangements, setIsLoadingArrangements] = useState(false)

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

  // Arrangement handlers
  const handleArrangementPopoverOpen = useCallback(async (open: boolean) => {
    setArrangementPopoverOpen(open)
    if (open && item.song_id) {
      setIsLoadingArrangements(true)
      const result = await getArrangementsForSong(item.song_id)
      if (result.data) {
        setArrangements(result.data)
      }
      setIsLoadingArrangements(false)
    }
  }, [item.song_id])

  const handleArrangementChange = useCallback(async (arrangementId: string | null) => {
    setIsUpdating(true)
    await onArrangementChange(item.id, arrangementId)
    setArrangementPopoverOpen(false)
    setIsUpdating(false)
  }, [item.id, onArrangementChange])

  return {
    // Popover states
    keyPopoverOpen,
    setKeyPopoverOpen,
    leaderPopoverOpen,
    durationPopoverOpen,
    descriptionPopoverOpen,
    arrangementPopoverOpen,

    // Edit states
    editMinutes,
    editSeconds,
    editDescription,
    setEditDescription,

    // Loading states
    isUpdating,
    ministryMembers,
    isLoadingMembers,
    arrangements,
    isLoadingArrangements,

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
    handleArrangementPopoverOpen,
    handleArrangementChange,
  }
}
