import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { updateMemberRole, updateMemberActive, updateMemberDeparture, updateMemberBaptism, updateMemberCampuses, updateMemberProfile, deleteOfflineMember } from '../actions'
import type { AssignableRole, Member, AvailableCampus } from './types'

export function useOptimisticMembers(
  serverMembers: Member[],
  allCampuses: AvailableCampus[]
) {
  // Local optimistic state - initialized from server, updated optimistically
  const [optimisticMembers, setOptimisticMembers] = useState<Member[]>(serverMembers)

  // Track if this is the initial mount to handle server data sync properly
  const isInitialMount = useRef(true)

  // Only sync with server data on initial mount or when member count changes significantly
  // (e.g., after creating/deleting a member). This prevents scroll reset during inline edits.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Sync when members are added or removed (create/delete operations)
    // Don't sync for inline updates as those are handled optimistically
    if (serverMembers.length !== optimisticMembers.length) {
      setOptimisticMembers(serverMembers)
    }
  }, [serverMembers, optimisticMembers.length])

  // Loading states for UI feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null)
  const [updatingDepartureId, setUpdatingDepartureId] = useState<string | null>(null)
  const [updatingBaptismId, setUpdatingBaptismId] = useState<string | null>(null)
  const [updatingCampusesId, setUpdatingCampusesId] = useState<string | null>(null)
  const [updatingProfileId, setUpdatingProfileId] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Helper to update a member optimistically
  const updateMemberOptimistically = useCallback((
    memberId: string,
    updates: Partial<Member>
  ) => {
    setOptimisticMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, ...updates } : m)
    )
  }, [])

  // Helper to revert a member to previous state
  const revertMember = useCallback((memberId: string, previousData: Partial<Member>) => {
    setOptimisticMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, ...previousData } : m)
    )
  }, [])

  const handleRoleChange = useCallback(async (memberId: string, newRole: AssignableRole) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousRole = member.role

    // Optimistic update
    updateMemberOptimistically(memberId, { role: newRole })
    setUpdatingId(memberId)

    try {
      const result = await updateMemberRole(memberId, newRole)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, { role: previousRole })
      }
    } catch {
      toast.error('Failed to update role')
      revertMember(memberId, { role: previousRole })
    } finally {
      setUpdatingId(null)
    }
  }, [optimisticMembers, updateMemberOptimistically, revertMember])

  const handleActiveChange = useCallback(async (memberId: string, active: boolean) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousActive = member.active
    const previousRole = member.role

    // Optimistic update - if setting inactive, role becomes 'member'
    const updates: Partial<Member> = { active }
    if (!active) {
      updates.role = 'member'
    }
    updateMemberOptimistically(memberId, updates)
    setUpdatingActiveId(memberId)

    try {
      const result = await updateMemberActive(memberId, active)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, { active: previousActive, role: previousRole })
      }
    } catch {
      toast.error('Failed to update active status')
      revertMember(memberId, { active: previousActive, role: previousRole })
    } finally {
      setUpdatingActiveId(null)
    }
  }, [optimisticMembers, updateMemberOptimistically, revertMember])

  const handleDepartureChange = useCallback(async (
    memberId: string,
    dateOfDeparture: string | null,
    reasonForDeparture: string | null
  ) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousData = {
      date_of_departure: member.date_of_departure,
      reason_for_departure: member.reason_for_departure,
      active: member.active,
      role: member.role,
    }

    // Optimistic update - if date is set, also set inactive
    const updates: Partial<Member> = {
      date_of_departure: dateOfDeparture,
      reason_for_departure: reasonForDeparture,
    }
    if (dateOfDeparture) {
      updates.active = false
      updates.role = 'member'
    }
    updateMemberOptimistically(memberId, updates)
    setUpdatingDepartureId(memberId)

    try {
      const result = await updateMemberDeparture(memberId, dateOfDeparture, reasonForDeparture)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, previousData)
      }
    } catch {
      toast.error('Failed to update departure information')
      revertMember(memberId, previousData)
    } finally {
      setUpdatingDepartureId(null)
    }
  }, [optimisticMembers, updateMemberOptimistically, revertMember])

  const handleBaptismChange = useCallback(async (
    memberId: string,
    baptism: boolean,
    baptismDate: string | null
  ) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousData = {
      baptism: member.baptism,
      baptism_date: member.baptism_date,
    }

    // Optimistic update
    updateMemberOptimistically(memberId, {
      baptism,
      baptism_date: baptismDate,
    })
    setUpdatingBaptismId(memberId)

    try {
      const result = await updateMemberBaptism(memberId, baptism, baptismDate)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, previousData)
      }
    } catch {
      toast.error('Failed to update baptism information')
      revertMember(memberId, previousData)
    } finally {
      setUpdatingBaptismId(null)
    }
  }, [optimisticMembers, updateMemberOptimistically, revertMember])

  const handleCampusesChange = useCallback(async (
    memberId: string,
    campusIds: string[]
  ) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousCampuses = member.campuses

    // Build new campuses array from IDs (first campus is primary)
    const newCampuses = campusIds
      .map(id => allCampuses.find(c => c.id === id))
      .filter((c): c is AvailableCampus => c !== undefined)
      .map((c, index) => ({ id: c.id, name: c.name, color: c.color, is_primary: index === 0 }))

    // Optimistic update
    updateMemberOptimistically(memberId, { campuses: newCampuses })
    setUpdatingCampusesId(memberId)

    try {
      const result = await updateMemberCampuses(memberId, campusIds)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, { campuses: previousCampuses })
      }
    } catch {
      toast.error('Failed to update campus assignments')
      revertMember(memberId, { campuses: previousCampuses })
    } finally {
      setUpdatingCampusesId(null)
    }
  }, [optimisticMembers, allCampuses, updateMemberOptimistically, revertMember])

  const handleProfileChange = useCallback(async (
    memberId: string,
    data: { sex?: string | null; dateOfBirth?: string | null; phone?: string | null; email?: string | null }
  ) => {
    const member = optimisticMembers.find(m => m.id === memberId)
    if (!member) return

    const previousData = {
      sex: member.sex,
      date_of_birth: member.date_of_birth,
      phone: member.phone,
      email: member.email,
    }

    // Build optimistic update
    const updates: Partial<Member> = {}
    if (data.sex !== undefined) updates.sex = data.sex
    if (data.dateOfBirth !== undefined) updates.date_of_birth = data.dateOfBirth
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.email !== undefined) updates.email = data.email

    // Optimistic update
    updateMemberOptimistically(memberId, updates)
    setUpdatingProfileId(memberId)

    try {
      const result = await updateMemberProfile(memberId, data)
      if (result.error) {
        toast.error(result.error)
        revertMember(memberId, previousData)
      }
    } catch {
      toast.error('Failed to update profile')
      revertMember(memberId, previousData)
    } finally {
      setUpdatingProfileId(null)
    }
  }, [optimisticMembers, updateMemberOptimistically, revertMember])

  const openDeleteDialog = useCallback((member: Member) => {
    setDeletingMember(member)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeletingMember(null)
  }, [])

  const handleDeleteMember = useCallback(async () => {
    if (!deletingMember) return { error: 'No member selected' }

    const memberToDelete = deletingMember

    // Optimistic delete
    setOptimisticMembers(prev => prev.filter(m => m.id !== memberToDelete.id))
    setIsDeleting(true)

    try {
      const result = await deleteOfflineMember(memberToDelete.id)
      if (result.error) {
        toast.error(result.error)
        // Revert - add member back
        setOptimisticMembers(prev => [...prev, memberToDelete])
        return { error: result.error }
      }
      setDeletingMember(null)
      return { success: true }
    } catch {
      toast.error('Failed to delete member')
      // Revert - add member back
      setOptimisticMembers(prev => [...prev, memberToDelete])
      return { error: 'Failed to delete member' }
    } finally {
      setIsDeleting(false)
    }
  }, [deletingMember])

  return {
    // Optimistic members data
    members: optimisticMembers,

    // Update states
    updatingId,
    updatingActiveId,
    updatingDepartureId,
    updatingBaptismId,
    updatingCampusesId,
    updatingProfileId,

    // Delete states
    deletingMember,
    isDeleting,

    // Handlers
    handleRoleChange,
    handleActiveChange,
    handleDepartureChange,
    handleBaptismChange,
    handleCampusesChange,
    handleProfileChange,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteMember,
  }
}
