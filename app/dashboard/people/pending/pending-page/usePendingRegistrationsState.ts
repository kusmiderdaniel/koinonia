import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  linkRegistrationToProfile,
  getOfflineMembers,
} from '../actions'
import type { PendingRegistration, OfflineMember } from './types'

export function usePendingRegistrationsState() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [offlineMembers, setOfflineMembers] = useState<OfflineMember[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] =
    useState<PendingRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const regResult = await getPendingRegistrations()

    if (regResult.data) {
      setRegistrations(regResult.data)
    }
    if (regResult.isAdmin !== undefined) {
      setIsAdmin(regResult.isAdmin)
    }

    // Only fetch offline members for admins (for linking)
    if (regResult.isAdmin) {
      const membersResult = await getOfflineMembers()
      if (membersResult.data) {
        setOfflineMembers(membersResult.data)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = useCallback(
    async (registration: PendingRegistration) => {
      setActionLoading(registration.id)
      const result = await approveRegistration(registration.id)
      setActionLoading(null)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `${registration.first_name} ${registration.last_name} has been approved`
        )
        setRegistrations((prev) => prev.filter((r) => r.id !== registration.id))
      }
    },
    []
  )

  const openRejectDialog = useCallback((registration: PendingRegistration) => {
    setSelectedRegistration(registration)
    setRejectReason('')
    setRejectDialogOpen(true)
  }, [])

  const handleReject = useCallback(async () => {
    if (!selectedRegistration) return

    setActionLoading(selectedRegistration.id)
    const result = await rejectRegistration(
      selectedRegistration.id,
      rejectReason || undefined
    )
    setActionLoading(null)
    setRejectDialogOpen(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Registration rejected`)
      setRegistrations((prev) =>
        prev.filter((r) => r.id !== selectedRegistration.id)
      )
    }
    setSelectedRegistration(null)
  }, [selectedRegistration, rejectReason])

  const openLinkDialog = useCallback((registration: PendingRegistration) => {
    setSelectedRegistration(registration)
    setSelectedProfileId('')
    setMemberSearch('')
    setLinkDialogOpen(true)
  }, [])

  const filteredOfflineMembers = useMemo(() => {
    return offlineMembers.filter((member) => {
      if (!memberSearch.trim()) return true
      const searchLower = memberSearch.toLowerCase()
      const fullName =
        `${member.first_name} ${member.last_name}`.toLowerCase()
      const email = member.email?.toLowerCase() || ''
      return fullName.includes(searchLower) || email.includes(searchLower)
    })
  }, [offlineMembers, memberSearch])

  const handleLink = useCallback(async () => {
    if (!selectedRegistration || !selectedProfileId) return

    setActionLoading(selectedRegistration.id)
    const result = await linkRegistrationToProfile(
      selectedRegistration.id,
      selectedProfileId
    )
    setActionLoading(null)
    setLinkDialogOpen(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      const member = offlineMembers.find((m) => m.id === selectedProfileId)
      toast.success(
        `${selectedRegistration.first_name} ${selectedRegistration.last_name} has been linked to ${member?.first_name} ${member?.last_name}`
      )
      setRegistrations((prev) =>
        prev.filter((r) => r.id !== selectedRegistration.id)
      )
      setOfflineMembers((prev) =>
        prev.filter((m) => m.id !== selectedProfileId)
      )
    }
    setSelectedRegistration(null)
  }, [selectedRegistration, selectedProfileId, offlineMembers])

  return {
    registrations,
    offlineMembers,
    filteredOfflineMembers,
    isAdmin,
    loading,
    actionLoading,

    // Dialog state
    rejectDialogOpen,
    setRejectDialogOpen,
    linkDialogOpen,
    setLinkDialogOpen,
    selectedRegistration,
    rejectReason,
    setRejectReason,
    selectedProfileId,
    setSelectedProfileId,
    memberSearch,
    setMemberSearch,

    // Handlers
    handleApprove,
    openRejectDialog,
    handleReject,
    openLinkDialog,
    handleLink,
  }
}
