// Core entity types shared across the application

/**
 * Base campus type with common fields
 * Extended by domain-specific types when needed
 */
export interface Campus {
  id: string
  name: string
  color: string
}

/**
 * Campus with additional metadata
 */
export interface CampusWithPrimary extends Campus {
  is_primary: boolean
}

/**
 * Brief ministry info used in selectors, badges, and related entities
 */
export interface MinistryBrief {
  id: string
  name: string
  color: string
}

/**
 * Ministry with campus association
 */
export interface MinistryWithCampus extends MinistryBrief {
  campus_id?: string | null
}

/**
 * Brief role info used in selectors and assignments
 */
export interface RoleBrief {
  id: string
  name: string
}

/**
 * Church member role hierarchy
 */
export type ChurchRole = 'owner' | 'admin' | 'leader' | 'volunteer' | 'member'

/**
 * Roles that can be assigned from the People table (excludes owner)
 */
export type AssignableChurchRole = 'admin' | 'leader' | 'volunteer' | 'member'

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<ChurchRole, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
}

/**
 * List of assignable roles
 */
export const ASSIGNABLE_ROLES: AssignableChurchRole[] = ['admin', 'leader', 'volunteer', 'member']

/**
 * Role styling configuration
 */
export const ROLE_COLORS: Record<ChurchRole, { bg: string; text: string; border: string; hoverBg: string }> = {
  owner: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hoverBg: 'hover:bg-purple-100' },
  admin: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hoverBg: 'hover:bg-red-100' },
  leader: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hoverBg: 'hover:bg-blue-100' },
  volunteer: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hoverBg: 'hover:bg-green-100' },
  member: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', hoverBg: 'hover:bg-gray-100' },
}

/**
 * Get badge classes for a role
 */
export function getRoleBadgeClasses(role: string): string {
  const colors = ROLE_COLORS[role as ChurchRole] || ROLE_COLORS.member
  return `inline-flex items-center ${colors.bg} ${colors.text} ${colors.border} border rounded-full px-2.5 py-1 text-xs font-medium`
}

/**
 * Check if a user role has higher or equal permissions than another
 */
export function hasPermission(userRole: ChurchRole, requiredRole: ChurchRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user can manage another user based on role hierarchy
 */
export function canManageRole(managerRole: ChurchRole, targetRole: ChurchRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole]
}
