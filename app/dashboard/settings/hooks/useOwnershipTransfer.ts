'use client'

import { useState, useCallback, useMemo } from 'react'
import { transferOwnership } from '../actions'
import type { Member, ChurchData } from '../types'

export interface OwnershipTransferTranslations {
  transferredSuccess: string
}

interface UseOwnershipTransferReturn {
  // State
  selectedNewOwner: string
  isTransferring: boolean
  transferDialogOpen: boolean

  // Computed
  adminMembers: Member[]
  selectedMember: Member | undefined

  // Actions
  setSelectedNewOwner: (id: string) => void
  setTransferDialogOpen: (open: boolean) => void
  handleTransferOwnership: (
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void,
    setChurchData: (updater: (prev: ChurchData | null) => ChurchData | null) => void
  ) => Promise<void>
}

export function useOwnershipTransfer(members: Member[], translations: OwnershipTransferTranslations): UseOwnershipTransferReturn {
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const adminMembers = useMemo(() => members.filter((m) => m.role === 'admin'), [members])

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedNewOwner),
    [members, selectedNewOwner]
  )

  const handleTransferOwnership = useCallback(
    async (
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void,
      setChurchData: (updater: (prev: ChurchData | null) => ChurchData | null) => void
    ) => {
      if (!selectedNewOwner) return

      setIsTransferring(true)
      setError(null)
      setSuccess(null)

      try {
        const result = await transferOwnership(selectedNewOwner)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess(translations.transferredSuccess)
          setChurchData((prev) => (prev ? { ...prev, role: 'admin' } : null))
          setSelectedNewOwner('')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setIsTransferring(false)
        setTransferDialogOpen(false)
      }
    },
    [selectedNewOwner, translations.transferredSuccess]
  )

  return {
    // State
    selectedNewOwner,
    isTransferring,
    transferDialogOpen,

    // Computed
    adminMembers,
    selectedMember,

    // Actions
    setSelectedNewOwner,
    setTransferDialogOpen,
    handleTransferOwnership,
  }
}
