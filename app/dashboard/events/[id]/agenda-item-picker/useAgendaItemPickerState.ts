import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { addAgendaItem, getMinistriesWithRoles } from '../../actions'
import { getAgendaPresets } from '@/app/dashboard/settings/agenda-presets/actions'
import type { Ministry, Preset } from './types'

interface UseAgendaItemPickerStateOptions {
  open: boolean
  eventId: string
  onSuccess: () => void
}

export function useAgendaItemPickerState({
  open,
  eventId,
  onSuccess,
}: UseAgendaItemPickerStateOptions) {
  // Data state
  const [presets, setPresets] = useState<Preset[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Loading/error state
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create new form state
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newMinistryId, setNewMinistryId] = useState<string>('')
  const [newDurationMinutes, setNewDurationMinutes] = useState('5')
  const [newDurationSeconds, setNewDurationSeconds] = useState('00')

  const loadMinistries = useCallback(async () => {
    const result = await getMinistriesWithRoles()
    if (result.data) {
      setMinistries(result.data)
    }
  }, [])

  const loadPresets = useCallback(async () => {
    setIsLoading(true)
    const result = await getAgendaPresets()
    if (result.data) {
      setPresets(result.data as Preset[])
    }
    setIsLoading(false)
  }, [])

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadPresets()
      loadMinistries()
      setSearchQuery('')
      setIsCreatingNew(false)
      setNewMinistryId('')
      setError(null)
    }
  }, [open, loadPresets, loadMinistries])

  const filteredPresets = useMemo(() => {
    return presets.filter((p) =>
      p.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [presets, debouncedSearchQuery])

  const showCreateOption =
    !!searchQuery.trim() &&
    !filteredPresets.some(
      (p) => p.title.toLowerCase() === searchQuery.toLowerCase()
    )

  const handleSelectPreset = useCallback(
    async (preset: Preset) => {
      if (!preset.ministry_id) {
        setError(
          'This preset has no ministry assigned. Please edit it in Settings first.'
        )
        return
      }

      setIsAdding(true)
      setError(null)

      const result = await addAgendaItem(eventId, {
        title: preset.title,
        description: preset.description || undefined,
        durationSeconds: preset.duration_seconds,
        ministryId: preset.ministry_id,
        sortOrder: 0,
      })

      if (result.error) {
        setError(result.error)
        setIsAdding(false)
        return
      }

      setIsAdding(false)
      onSuccess()
    },
    [eventId, onSuccess]
  )

  const handleStartCreateNew = useCallback(() => {
    setNewTitle(searchQuery.trim())
    setNewMinistryId('')
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
    setIsCreatingNew(true)
  }, [searchQuery])

  const handleMinutesChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setNewDurationMinutes(cleaned)
    }
  }, [])

  const handleSecondsChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setNewDurationSeconds(cleaned)
      }
    }
  }, [])

  const handleCreateAndAdd = useCallback(async () => {
    if (!newTitle.trim()) return

    if (!newMinistryId) {
      setError('Please select a ministry')
      return
    }

    const mins = parseInt(newDurationMinutes, 10) || 0
    const secs = parseInt(newDurationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    setIsAdding(true)
    setError(null)

    const result = await addAgendaItem(eventId, {
      title: newTitle.trim(),
      durationSeconds: totalSeconds > 0 ? totalSeconds : 60,
      ministryId: newMinistryId,
      sortOrder: 0,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }, [newTitle, newMinistryId, newDurationMinutes, newDurationSeconds, eventId, onSuccess])

  const handleBackToList = useCallback(() => {
    setIsCreatingNew(false)
    setNewTitle('')
    setNewMinistryId('')
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
  }, [])

  return {
    // Data
    presets,
    ministries,
    filteredPresets,

    // Search
    searchQuery,
    setSearchQuery,
    showCreateOption,

    // Status
    isLoading,
    isAdding,
    error,

    // Create form state
    isCreatingNew,
    createFormState: {
      title: newTitle,
      ministryId: newMinistryId,
      durationMinutes: newDurationMinutes,
      durationSeconds: newDurationSeconds,
    },
    setNewTitle,
    setNewMinistryId,
    handleMinutesChange,
    handleSecondsChange,

    // Actions
    handleSelectPreset,
    handleStartCreateNew,
    handleCreateAndAdd,
    handleBackToList,
  }
}
