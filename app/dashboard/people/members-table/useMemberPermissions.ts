import { useCallback, useMemo } from 'react'
import { type Role, roleHierarchy } from '../components/member-table-types'
import type { Member } from './types'

interface UseMemberPermissionsOptions {
  currentUserId: string
  currentUserRole: string
}

export function useMemberPermissions({
  currentUserId,
  currentUserRole,
}: UseMemberPermissionsOptions) {
  const canEditActive = useMemo(
    () => ['owner', 'admin', 'leader'].includes(currentUserRole),
    [currentUserRole]
  )

  const canEditFields = useMemo(
    () => ['owner', 'admin', 'leader'].includes(currentUserRole),
    [currentUserRole]
  )

  const canEditRole = useCallback((member: Member) => {
    if (member.member_type === 'offline') return false
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole])

  const canEditActiveStatus = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditActive) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditActive])

  const canEditDeparture = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditFields) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditFields])

  return {
    canEditActive,
    canEditFields,
    canEditRole,
    canEditActiveStatus,
    canEditDeparture,
  }
}
