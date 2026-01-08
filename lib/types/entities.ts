// Core entity types shared across the application

// Import centralized role hierarchy from permissions
import { ROLE_HIERARCHY, type UserRole } from '@/lib/permissions'

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
 * Alias for UserRole from permissions for backwards compatibility
 */
export type ChurchRole = UserRole

/**
 * Roles that can be assigned from the People table (excludes owner)
 */
export type AssignableChurchRole = 'admin' | 'leader' | 'volunteer' | 'member'

// Re-export ROLE_HIERARCHY for backwards compatibility
export { ROLE_HIERARCHY }

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
