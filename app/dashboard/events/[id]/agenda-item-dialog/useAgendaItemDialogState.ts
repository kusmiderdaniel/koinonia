import { useState, useEffect, useCallback } from 'react'
import {
  addAgendaItem,
  updateAgendaItem,
  getMinistriesWithRoles,
  getMinistryMembersForAgenda,
} from '../../actions'
import { getAgendaPresets } from '@/app/dashboard/settings/agenda-presets/actions'
import type { AgendaItem, Ministry, Member, Preset } from './types'

interface UseAgendaItemDialogStateOptions {
  open: boolean
  item: AgendaItem | null
  eventId: string
  onSuccess: () => void
}

export function useAgendaItemDialogState({
  open,
  item,
  eventId,
  onSuccess,
}: UseAgendaItemDialogStateOptions) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('5')
  const [durationSeconds, setDurationSeconds] = useState('00')
  const [ministryId, setMinistryId] = useState<string>('')
  const [leaderId, setLeaderId] = useState<string>('')

  // Data state
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [presets, setPresets] = useState<Preset[]>([])

  // Loading/error state
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!item

  const loadData = useCallback(async () => {
    const [ministriesResult, presetsResult] = await Promise.all([
      getMinistriesWithRoles(),
      getAgendaPresets(),
    ])
    if (ministriesResult.data) {
      setMinistries(ministriesResult.data)
    }
    if (presetsResult.data) {
      setPresets(presetsResult.data as Preset[])
    }
  }, [])

  const loadMinistryMembers = useCallback(async (selectedMinistryId: string) => {
    setIsLoadingMembers(true)
    setLeaderId('none')
    const result = await getMinistryMembersForAgenda(selectedMinistryId)
    if (result.data) {
      setMembers(result.data as Member[])
    }
    setIsLoadingMembers(false)
  }, [])

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (item) {
        setTitle(item.title)
        setDescription(item.description || '')
        const totalSeconds = item.duration_seconds
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setDurationMinutes(mins.toString())
        setDurationSeconds(secs.toString().padStart(2, '0'))
        setMinistryId(item.ministry_id || '')
        setLeaderId(item.leader_id || 'none')
      } else {
        setTitle('')
        setDescription('')
        setDurationMinutes('5')
        setDurationSeconds('00')
        setMinistryId('')
        setLeaderId('none')
      }
      setError(null)
      loadData()
    }
  }, [open, item, loadData])

  // Load ministry members when ministry changes
  useEffect(() => {
    if (ministryId) {
      loadMinistryMembers(ministryId)
    } else {
      setMembers([])
    }
  }, [ministryId, loadMinistryMembers])

  const handleMinutesChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setDurationMinutes(cleaned)
    }
  }, [])

  const handleSecondsChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setDurationSeconds(cleaned)
      }
    }
  }, [])

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId)
      if (preset) {
        setTitle(preset.title)
        setDescription(preset.description || '')
        const totalSeconds = preset.duration_seconds
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setDurationMinutes(mins.toString())
        setDurationSeconds(secs.toString().padStart(2, '0'))
        if (preset.ministry_id) {
          setMinistryId(preset.ministry_id)
        }
      }
    },
    [presets]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError(null)

      if (!item && !ministryId) {
        setError('Please select a ministry')
        setIsLoading(false)
        return
      }

      const mins = parseInt(durationMinutes, 10) || 0
      const secs = parseInt(durationSeconds, 10) || 0
      const totalSeconds = mins * 60 + secs

      if (totalSeconds <= 0) {
        setError('Duration must be greater than 0')
        setIsLoading(false)
        return
      }

      const data = {
        title,
        description: description || undefined,
        durationSeconds: totalSeconds,
        leaderId: leaderId === 'none' ? null : leaderId,
        ministryId: ministryId,
        sortOrder: item?.sort_order ?? 0,
      }

      const result = item
        ? await updateAgendaItem(item.id, data)
        : await addAgendaItem(eventId, data)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      onSuccess()
    },
    [
      title,
      description,
      durationMinutes,
      durationSeconds,
      ministryId,
      leaderId,
      item,
      eventId,
      onSuccess,
    ]
  )

  return {
    // Form state
    formState: {
      title,
      description,
      durationMinutes,
      durationSeconds,
      ministryId,
      leaderId,
    },

    // Setters
    setTitle,
    setDescription,
    setMinistryId,
    setLeaderId,
    handleMinutesChange,
    handleSecondsChange,
    handlePresetSelect,

    // Data
    ministries,
    members,
    presets,

    // Status
    isEditing,
    isLoading,
    isLoadingMembers,
    error,

    // Actions
    handleSubmit,
  }
}
