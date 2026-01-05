'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getOrCreateCalendarToken,
  regenerateCalendarToken,
  getChurchCampuses,
} from '../actions'
import type { Campus } from './types'

export function useCalendarIntegrationState() {
  const [token, setToken] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [churchSubdomain, setChurchSubdomain] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedPersonal, setCopiedPersonal] = useState(false)
  const [copiedCampusId, setCopiedCampusId] = useState<string | null>(null)

  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://koinonia.vercel.app'
  }, [])

  const personalCalendarUrl = useMemo(
    () => (token ? `${baseUrl}/api/calendar/personal/${token}` : null),
    [baseUrl, token]
  )

  const personalWebcalUrl = useMemo(
    () =>
      token
        ? `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/personal/${token}`
        : null,
    [baseUrl, token]
  )

  const getPublicCalendarUrl = useCallback(
    (campusId: string) =>
      `${baseUrl}/api/calendar/public/${churchSubdomain}/${campusId}`,
    [baseUrl, churchSubdomain]
  )

  const getPublicWebcalUrl = useCallback(
    (campusId: string) =>
      `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/public/${churchSubdomain}/${campusId}`,
    [baseUrl, churchSubdomain]
  )

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      // Load token
      const tokenResult = await getOrCreateCalendarToken()
      if (tokenResult.error) {
        setError(tokenResult.error)
      } else if (tokenResult.data) {
        setToken(tokenResult.data.token)
      }

      // Load campuses
      const campusResult = await getChurchCampuses()
      if (campusResult.data) {
        setCampuses(campusResult.data)
        setChurchSubdomain(campusResult.churchSubdomain || '')
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    setError(null)

    const result = await regenerateCalendarToken()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setToken(result.data.token)
    }

    setIsRegenerating(false)
  }, [])

  const copyToClipboard = useCallback(
    async (text: string, type: 'personal' | string) => {
      try {
        await navigator.clipboard.writeText(text)
        if (type === 'personal') {
          setCopiedPersonal(true)
          setTimeout(() => setCopiedPersonal(false), 2000)
        } else {
          setCopiedCampusId(type)
          setTimeout(() => setCopiedCampusId(null), 2000)
        }
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        if (type === 'personal') {
          setCopiedPersonal(true)
          setTimeout(() => setCopiedPersonal(false), 2000)
        } else {
          setCopiedCampusId(type)
          setTimeout(() => setCopiedCampusId(null), 2000)
        }
      }
    },
    []
  )

  return {
    token,
    campuses,
    isLoading,
    isRegenerating,
    error,
    copiedPersonal,
    copiedCampusId,
    personalCalendarUrl,
    personalWebcalUrl,
    getPublicCalendarUrl,
    getPublicWebcalUrl,
    handleRegenerate,
    copyToClipboard,
  }
}
