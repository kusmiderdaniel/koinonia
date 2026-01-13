// People-specific types
// Re-export shared types for convenience
export {
  type ChurchRole as Role,
  type AssignableChurchRole as AssignableRole,
  type MinistryBrief as Ministry,
  type CampusWithPrimary as Campus,
  type RoleBrief as MinistryRole,
  ROLE_HIERARCHY as roleHierarchy,
  ASSIGNABLE_ROLES as assignableRoles,
  ROLE_COLORS as roleColors,
  getRoleBadgeClasses,
  formatDate,
  formatDateOfBirth,
  calculateAge,
} from '@/lib/types'

import type { CustomFieldValuesMap } from '@/types/custom-fields'

import { calculateAge as calcAge, formatDate as fmt } from '@/lib/types'

// Re-export calculateAge with string return for backwards compatibility
export { calcAge as calculateAgeNumber }

// String version for display (backwards compatibility)
export function calculateAgeString(dateOfBirth: string | null): string {
  const age = calcAge(dateOfBirth)
  return age !== null ? age.toString() : '—'
}

// Ministry member relationship
export interface MinistryMember {
  id: string
  role: MinistryRole | MinistryRole[] | null
  ministry: Ministry | Ministry[] | null
}

// Re-import for local use
import type { MinistryBrief as Ministry, CampusWithPrimary as Campus, RoleBrief as MinistryRole } from '@/lib/types'

// Full member with all details for the people table
export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string
  active: boolean
  date_of_birth: string | null
  sex: string | null
  date_of_departure: string | null
  reason_for_departure: string | null
  baptism: boolean
  baptism_date: string | null
  member_type: string
  created_at: string
  ministry_members: MinistryMember[]
  campuses: Campus[]
  custom_field_values: CustomFieldValuesMap
}
