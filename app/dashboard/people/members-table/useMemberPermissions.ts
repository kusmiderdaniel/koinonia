import { useCallback, useMemo } from 'react'
import { isLeaderOrAbove, isAdminOrOwner, ROLE_HIERARCHY, type UserRole } from '@/lib/permissions'
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
    () => isLeaderOrAbove(currentUserRole),
    [currentUserRole]
  )

  const canEditFields = useMemo(
    () => isLeaderOrAbove(currentUserRole),
    [currentUserRole]
  )

  const canEditRole = useCallback((member: Member) => {
    if (member.member_type === 'offline') return false
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return false

    const currentLevel = ROLE_HIERARCHY[currentUserRole as UserRole] || 0
    const memberLevel = ROLE_HIERARCHY[member.role as UserRole] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole])

  const canEditActiveStatus = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditActive) return false

    const currentLevel = ROLE_HIERARCHY[currentUserRole as UserRole] || 0
    const memberLevel = ROLE_HIERARCHY[member.role as UserRole] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditActive])

  const canEditDeparture = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditFields) return false

    const currentLevel = ROLE_HIERARCHY[currentUserRole as UserRole] || 0
    const memberLevel = ROLE_HIERARCHY[member.role as UserRole] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditFields])

  // Only admins and owners can delete offline members
  const canDeleteOffline = useMemo(
    () => isAdminOrOwner(currentUserRole),
    [currentUserRole]
  )

  return {
    canEditActive,
    canEditFields,
    canEditRole,
    canEditActiveStatus,
    canEditDeparture,
    canDeleteOffline,
  }
}
