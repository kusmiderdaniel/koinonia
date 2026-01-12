'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isLeaderOrAbove, isAdminOrOwner } from '@/lib/permissions'
import { updateChurchSettings, regenerateJoinCode } from '../actions'
import type { ChurchData, ChurchPreferences, ChurchSettingsData, Location, Member } from '../types'
import type { Campus } from '../actions'

export interface ChurchSettingsTranslations {
  savedSuccess: string
  regeneratedSuccess: string
}

const churchSettingsSchema = z.object({
  name: z.string().min(2, 'Church name must be at least 2 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type ChurchSettingsInput = z.infer<typeof churchSettingsSchema>

export interface SettingsInitialData {
  church: ChurchSettingsData
  members: Member[]
  locations: Location[]
  campuses: Campus[]
}

interface UseChurchSettingsReturn {
  // Form
  form: ReturnType<typeof useForm<ChurchSettingsInput>>

  // State
  error: string | null
  success: string | null
  isLoading: boolean
  isLoadingData: boolean
  churchData: ChurchData | null

  // Initial data for other hooks
  members: Member[]
  locations: Location[]
  campuses: Campus[]
  preferences: ChurchPreferences

  // Computed
  isAdmin: boolean
  isOwner: boolean
  canManageLocations: boolean

  // Join code
  joinCodeCopied: boolean
  isRegeneratingCode: boolean

  // Actions
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
  onSubmit: (data: ChurchSettingsInput) => Promise<void>
  copyJoinCode: () => Promise<void>
  handleRegenerateJoinCode: () => Promise<void>
  setLocations: (locations: Location[]) => void
  setCampuses: (campuses: Campus[]) => void
}

export function useChurchSettings(initialData: SettingsInitialData | undefined, translations: ChurchSettingsTranslations): UseChurchSettingsReturn {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData] = useState(false) // No loading when initial data provided
  const [churchData, setChurchData] = useState<ChurchData | null>(
    initialData ? {
      subdomain: initialData.church.subdomain,
      join_code: initialData.church.join_code,
      role: initialData.church.role,
    } : null
  )
  const [joinCodeCopied, setJoinCodeCopied] = useState(false)
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false)
  const [members, setMembers] = useState<Member[]>(initialData?.members || [])
  const [locations, setLocations] = useState<Location[]>(initialData?.locations || [])
  const [campuses, setCampuses] = useState<Campus[]>(initialData?.campuses || [])
  const [preferences, setPreferences] = useState<ChurchPreferences>(
    initialData ? {
      timezone: initialData.church.timezone || 'America/New_York',
      firstDayOfWeek: initialData.church.first_day_of_week ?? 1,
      timeFormat: initialData.church.time_format || '24h',
      defaultEventVisibility:
        (initialData.church.default_event_visibility as 'members' | 'volunteers' | 'leaders') ||
        'members',
    } : {
      timezone: 'America/New_York',
      firstDayOfWeek: 1,
      timeFormat: '24h',
      defaultEventVisibility: 'members',
    }
  )

  // Refs for timeout cleanup
  const joinCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (joinCodeTimeoutRef.current) clearTimeout(joinCodeTimeoutRef.current)
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  const form = useForm<ChurchSettingsInput>({
    resolver: zodResolver(churchSettingsSchema),
    defaultValues: initialData ? {
      name: initialData.church.name,
      address: initialData.church.address || '',
      city: initialData.church.city || '',
      country: initialData.church.country || '',
      zipCode: initialData.church.zip_code || '',
      phone: initialData.church.phone || '',
      email: initialData.church.email || '',
      website: initialData.church.website || '',
    } : undefined,
  })

  const onSubmit = useCallback(
    async (data: ChurchSettingsInput) => {
      setError(null)
      setSuccess(null)
      setIsLoading(true)

      try {
        const result = await updateChurchSettings(data)
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccess(translations.savedSuccess)
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    [translations.savedSuccess]
  )

  const copyJoinCode = useCallback(async () => {
    if (!churchData?.join_code) return
    await navigator.clipboard.writeText(churchData.join_code)
    setJoinCodeCopied(true)
    if (joinCodeTimeoutRef.current) clearTimeout(joinCodeTimeoutRef.current)
    joinCodeTimeoutRef.current = setTimeout(() => setJoinCodeCopied(false), 2000)
  }, [churchData?.join_code])

  const handleRegenerateJoinCode = useCallback(async () => {
    setIsRegeneratingCode(true)
    setError(null)

    try {
      const result = await regenerateJoinCode()
      if (result.error) {
        setError(result.error)
      } else if (result.success && result.joinCode) {
        setChurchData((prev) => prev ? { ...prev, join_code: result.joinCode! } : null)
        setSuccess(translations.regeneratedSuccess)
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to regenerate join code')
    } finally {
      setIsRegeneratingCode(false)
    }
  }, [translations.regeneratedSuccess])

  const isAdmin = useMemo(
    () => isAdminOrOwner(churchData?.role || ''),
    [churchData?.role]
  )

  const isOwner = useMemo(() => churchData?.role === 'owner', [churchData?.role])

  const canManageLocations = useMemo(
    () => isLeaderOrAbove(churchData?.role || ''),
    [churchData?.role]
  )

  return {
    // Form
    form,

    // State
    error,
    success,
    isLoading,
    isLoadingData,
    churchData,

    // Initial data
    members,
    locations,
    campuses,
    preferences,

    // Computed
    isAdmin,
    isOwner,
    canManageLocations,

    // Join code
    joinCodeCopied,
    isRegeneratingCode,

    // Actions
    setError,
    setSuccess,
    onSubmit,
    copyJoinCode,
    handleRegenerateJoinCode,
    setLocations,
    setCampuses,
  }
}
