'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getChurchSettings, updateChurchSettings, getChurchMembers, getLocations, regenerateJoinCode } from '../actions'
import type { ChurchData, ChurchPreferences, Location, Member } from '../types'

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
}

export function useChurchSettings(): UseChurchSettingsReturn {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [churchData, setChurchData] = useState<ChurchData | null>(null)
  const [joinCodeCopied, setJoinCodeCopied] = useState(false)
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [preferences, setPreferences] = useState<ChurchPreferences>({
    timezone: 'America/New_York',
    firstDayOfWeek: 1,
    defaultEventVisibility: 'members',
  })

  const form = useForm<ChurchSettingsInput>({
    resolver: zodResolver(churchSettingsSchema),
  })

  useEffect(() => {
    async function loadSettings() {
      const result = await getChurchSettings()
      if (result.error) {
        setError(result.error)
        setIsLoadingData(false)
        return
      }

      if (result.data) {
        setChurchData({
          subdomain: result.data.subdomain,
          join_code: result.data.join_code,
          role: result.data.role,
        })
        form.reset({
          name: result.data.name,
          address: result.data.address || '',
          city: result.data.city || '',
          country: result.data.country || '',
          zipCode: result.data.zip_code || '',
          phone: result.data.phone || '',
          email: result.data.email || '',
          website: result.data.website || '',
        })

        // Set preferences
        setPreferences({
          timezone: result.data.timezone || 'America/New_York',
          firstDayOfWeek: result.data.first_day_of_week ?? 1,
          defaultEventVisibility:
            (result.data.default_event_visibility as 'members' | 'volunteers' | 'leaders') ||
            'members',
        })

        // Parallel load: members (if owner) and locations (if can manage)
        const isOwner = result.data.role === 'owner'
        const canManageLocs = ['owner', 'admin', 'leader'].includes(result.data.role)

        const [membersResult, locationsResult] = await Promise.all([
          isOwner ? getChurchMembers() : Promise.resolve({ data: [] }),
          canManageLocs ? getLocations() : Promise.resolve({ data: [] }),
        ])

        if (membersResult.data) {
          setMembers(membersResult.data)
        }
        if (locationsResult.data) {
          setLocations(locationsResult.data)
        }
      }
      setIsLoadingData(false)
    }
    loadSettings()
  }, [form])

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
          setSuccess('Church settings updated successfully!')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const copyJoinCode = useCallback(async () => {
    if (!churchData?.join_code) return
    await navigator.clipboard.writeText(churchData.join_code)
    setJoinCodeCopied(true)
    setTimeout(() => setJoinCodeCopied(false), 2000)
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
        setSuccess('Join code regenerated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to regenerate join code')
    } finally {
      setIsRegeneratingCode(false)
    }
  }, [])

  const isAdmin = useMemo(
    () => churchData?.role === 'admin' || churchData?.role === 'owner',
    [churchData?.role]
  )

  const isOwner = useMemo(() => churchData?.role === 'owner', [churchData?.role])

  const canManageLocations = useMemo(
    () => ['owner', 'admin', 'leader'].includes(churchData?.role || ''),
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
  }
}
