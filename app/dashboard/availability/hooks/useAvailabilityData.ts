'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getMyUnavailability,
  createUnavailability,
  updateUnavailability,
  deleteUnavailability,
  getChurchSettings,
} from '../actions'
import type { Unavailability } from '../types'
import { parseDate, isUpcoming } from '../types'

interface UseAvailabilityDataReturn {
  // Data
  unavailability: Unavailability[]
  firstDayOfWeek: 0 | 1
  unavailableDates: Date[]
  upcomingItems: Unavailability[]
  pastItems: Unavailability[]

  // State
  isLoading: boolean
  isSaving: boolean
  error: string

  // Actions
  setError: (error: string) => void
  setIsSaving: (saving: boolean) => void
  loadUnavailability: () => Promise<void>
  createEntry: (data: {
    startDate: string
    endDate: string
    reason?: string
  }) => Promise<{ success?: boolean; error?: string }>
  updateEntry: (
    id: string,
    data: { startDate: string; endDate: string; reason?: string }
  ) => Promise<{ success?: boolean; error?: string }>
  deleteEntry: (id: string) => Promise<{ success?: boolean }>
}

export function useAvailabilityData(): UseAvailabilityDataReturn {
  const [unavailability, setUnavailability] = useState<Unavailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>(1)

  const loadUnavailability = useCallback(async () => {
    setIsLoading(true)
    const result = await getMyUnavailability()
    if (result.data) {
      setUnavailability(result.data)
    }
    setIsLoading(false)
  }, [])

  const loadChurchSettings = useCallback(async () => {
    const result = await getChurchSettings()
    if (result.data) {
      setFirstDayOfWeek(result.data.firstDayOfWeek as 0 | 1)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load data on mount
    loadUnavailability()
     
    loadChurchSettings()
  }, [loadUnavailability, loadChurchSettings])

  // Get all unavailable dates for highlighting on calendar
  const unavailableDates = useMemo(() => {
    const dates: Date[] = []
    unavailability.forEach((item) => {
      const start = parseDate(item.start_date)
      const end = parseDate(item.end_date)
      const current = new Date(start)
      while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
    })
    return dates
  }, [unavailability])

  const upcomingItems = useMemo(
    () => unavailability.filter((item) => isUpcoming(item.end_date)),
    [unavailability]
  )

  const pastItems = useMemo(
    () => unavailability.filter((item) => !isUpcoming(item.end_date)),
    [unavailability]
  )

  const createEntry = useCallback(
    async (data: { startDate: string; endDate: string; reason?: string }) => {
      setIsSaving(true)
      setError('')

      const result = await createUnavailability(data)

      if ('error' in result && result.error) {
        setError(result.error)
        setIsSaving(false)
        return { error: result.error }
      }

      setIsSaving(false)
      await loadUnavailability()
      return { success: true }
    },
    [loadUnavailability]
  )

  const updateEntry = useCallback(
    async (id: string, data: { startDate: string; endDate: string; reason?: string }) => {
      setIsSaving(true)
      setError('')

      const result = await updateUnavailability(id, data)

      if ('error' in result && result.error) {
        setError(result.error)
        setIsSaving(false)
        return { error: result.error }
      }

      setIsSaving(false)
      await loadUnavailability()
      return { success: true }
    },
    [loadUnavailability]
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      const result = await deleteUnavailability(id)
      if (result.success) {
        await loadUnavailability()
      }
      return result
    },
    [loadUnavailability]
  )

  return {
    // Data
    unavailability,
    firstDayOfWeek,
    unavailableDates,
    upcomingItems,
    pastItems,

    // State
    isLoading,
    isSaving,
    error,

    // Actions
    setError,
    setIsSaving,
    loadUnavailability,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
