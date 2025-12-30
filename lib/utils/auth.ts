// Shared authentication and permission utilities

export type UserRole = 'owner' | 'admin' | 'leader' | 'volunteer' | 'member'

/**
 * Check if a user role can manage resources (create, update)
 * Owners, admins, and leaders can manage
 */
export function canManage(role: string): boolean {
  return ['owner', 'admin', 'leader'].includes(role)
}

/**
 * Check if a user role can delete resources
 * Only owners and admins can delete
 */
export function canDelete(role: string): boolean {
  return ['owner', 'admin'].includes(role)
}

/**
 * Check if a user role is at least a leader
 */
export function isLeaderOrAbove(role: string): boolean {
  return ['owner', 'admin', 'leader'].includes(role)
}

/**
 * Check if a user role is at least an admin
 */
export function isAdminOrAbove(role: string): boolean {
  return ['owner', 'admin'].includes(role)
}

/**
 * Check if a user role is the owner
 */
export function isOwner(role: string): boolean {
  return role === 'owner'
}

/**
 * Get the hierarchy level of a role (higher = more permissions)
 */
export function getRoleLevel(role: string): number {
  const levels: Record<string, number> = {
    owner: 4,
    admin: 3,
    leader: 2,
    volunteer: 1,
    member: 0,
  }
  return levels[role] ?? 0
}

/**
 * Check if sourceRole can modify targetRole
 * A role can only modify roles with lower hierarchy
 */
export function canModifyRole(sourceRole: string, targetRole: string): boolean {
  return getRoleLevel(sourceRole) > getRoleLevel(targetRole)
}
