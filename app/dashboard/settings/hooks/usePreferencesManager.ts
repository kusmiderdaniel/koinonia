'use client'

import { useState, useCallback } from 'react'
import { updateChurchPreferences } from '../actions'
import type { ChurchPreferences } from '../types'

interface UsePreferencesManagerReturn {
  // State
  timezone: string
  firstDayOfWeek: number
  timeFormat: '12h' | '24h'
  defaultEventVisibility: 'members' | 'volunteers' | 'leaders'
  isSavingPreferences: boolean

  // Actions
  setTimezone: (timezone: string) => void
  setFirstDayOfWeek: (day: number) => void
  setTimeFormat: (format: '12h' | '24h') => void
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
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')
  const [defaultEventVisibility, setDefaultEventVisibility] = useState<
    'members' | 'volunteers' | 'leaders'
  >('members')
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  const initializePreferences = useCallback((prefs: ChurchPreferences) => {
    setTimezone(prefs.timezone)
    setFirstDayOfWeek(prefs.firstDayOfWeek)
    setTimeFormat(prefs.timeFormat)
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
        timeFormat,
        defaultEventVisibility,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Church preferences updated!')
      }
      setIsSavingPreferences(false)
    },
    [timezone, firstDayOfWeek, timeFormat, defaultEventVisibility]
  )

  return {
    // State
    timezone,
    firstDayOfWeek,
    timeFormat,
    defaultEventVisibility,
    isSavingPreferences,

    // Actions
    setTimezone,
    setFirstDayOfWeek,
    setTimeFormat,
    setDefaultEventVisibility,
    initializePreferences,
    handleSavePreferences,
  }
}
