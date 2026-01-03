// Shared types used across the application
// Re-export all types from organized modules

// Entity types (Campus, Ministry, Role, etc.)
export {
  type Campus,
  type CampusWithPrimary,
  type MinistryBrief,
  type MinistryWithCampus,
  type RoleBrief,
  type ChurchRole,
  type AssignableChurchRole,
  ROLE_HIERARCHY,
  ASSIGNABLE_ROLES,
  ROLE_COLORS,
  getRoleBadgeClasses,
  hasPermission,
  canManageRole,
} from './entities'

// Person types
export {
  type Person,
  type PersonBrief,
  type Member,
  type MemberFull,
  getFullName,
  getInitials,
} from './person'

// Common types and utilities
export {
  type Location,
  type BaseEntity,
  type NamedEntity,
  type ColoredEntity,
  type SongBrief,
  type Tag,
  formatDate,
  formatDateOfBirth,
  calculateAge,
  formatAge,
} from './common'
