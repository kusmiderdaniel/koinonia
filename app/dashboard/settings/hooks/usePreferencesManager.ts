'use client'

import { useState, useCallback } from 'react'
import { updateChurchPreferences } from '../actions'
import type { ChurchPreferences } from '../types'

interface UsePreferencesManagerReturn {
  // State
  timezone: string
  firstDayOfWeek: number
  defaultEventVisibility: 'members' | 'volunteers' | 'leaders'
  isSavingPreferences: boolean

  // Actions
  setTimezone: (timezone: string) => void
  setFirstDayOfWeek: (day: number) => void
  setDefaultEventVisibility: (visibility: 'members' | 'volunteers' | 'leaders') => void
  initializePreferences: (prefs: ChurchPreferences) => void
  handleSavePreferences: (
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
}

export function usePreferencesManager(): UsePreferencesManagerReturn {
  const [timezone, setTimezone] = useState('America/New_York')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(1)
  const [defaultEventVisibility, setDefaultEventVisibility] = useState<
    'members' | 'volunteers' | 'leaders'
  >('members')
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  const initializePreferences = useCallback((prefs: ChurchPreferences) => {
    setTimezone(prefs.timezone)
    setFirstDayOfWeek(prefs.firstDayOfWeek)
    setDefaultEventVisibility(prefs.defaultEventVisibility)
  }, [])

  const handleSavePreferences = useCallback(
    async (
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      setIsSavingPreferences(true)
      setError(null)
      setSuccess(null)

      const result = await updateChurchPreferences({
        timezone,
        firstDayOfWeek,
        defaultEventVisibility,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Church preferences updated!')
      }
      setIsSavingPreferences(false)
    },
    [timezone, firstDayOfWeek, defaultEventVisibility]
  )

  return {
    // State
    timezone,
    firstDayOfWeek,
    defaultEventVisibility,
    isSavingPreferences,

    // Actions
    setTimezone,
    setFirstDayOfWeek,
    setDefaultEventVisibility,
    initializePreferences,
    handleSavePreferences,
  }
}
