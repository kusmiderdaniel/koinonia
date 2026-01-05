// Centralized role-based access control configuration
// All role and permission checks should use these utilities

export type UserRole = 'owner' | 'admin' | 'leader' | 'volunteer' | 'member'

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
}

// Page access permissions by role
export const PAGE_ACCESS = {
  home: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[],
  dashboard: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[], // alias for home
  inbox: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[], // Everyone has inbox
  events: ['owner', 'admin', 'leader', 'volunteer'] as UserRole[],
  tasks: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[], // Everyone can access tasks
  people: ['owner', 'admin', 'leader'] as UserRole[],
  ministries: ['owner', 'admin', 'leader'] as UserRole[],
  songs: ['owner', 'admin', 'leader'] as UserRole[],
  forms: ['owner', 'admin', 'leader'] as UserRole[], // Leaders+ can manage forms
  settings: ['owner', 'admin'] as UserRole[],
  profile: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[],
  availability: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[],
} as const

export type PageKey = keyof typeof PAGE_ACCESS

// Feature-level permissions
export const FEATURE_PERMISSIONS = {
  // Event permissions
  createEvent: ['owner', 'admin'] as UserRole[],
  editEvent: ['owner', 'admin'] as UserRole[],
  deleteEvent: ['owner', 'admin'] as UserRole[],
  viewEvents: ['owner', 'admin', 'leader', 'volunteer'] as UserRole[],
  // Leaders can manage event content (agenda, songs, positions) but not event details
  manageEventContent: ['owner', 'admin', 'leader'] as UserRole[],

  // Template permissions
  createTemplate: ['owner', 'admin'] as UserRole[],
  editTemplate: ['owner', 'admin'] as UserRole[],
  deleteTemplate: ['owner', 'admin'] as UserRole[],
  viewTemplates: ['owner', 'admin', 'leader'] as UserRole[],
  createEventFromTemplate: ['owner', 'admin'] as UserRole[],

  // Ministry permissions
  createMinistry: ['owner', 'admin'] as UserRole[],
  editMinistry: ['owner', 'admin'] as UserRole[],
  deleteMinistry: ['owner', 'admin'] as UserRole[],
  // Leaders can manage roles and members within their campus ministries
  manageMinistryRoles: ['owner', 'admin', 'leader'] as UserRole[],
  manageMinistryMembers: ['owner', 'admin', 'leader'] as UserRole[],

  // People/Members permissions
  viewAllPeople: ['owner', 'admin'] as UserRole[],
  viewCampusPeople: ['owner', 'admin', 'leader'] as UserRole[],
  approvePendingRegistrations: ['owner', 'admin', 'leader'] as UserRole[],
  changeUserRole: ['owner', 'admin'] as UserRole[],

  // Songs permissions
  manageSongs: ['owner', 'admin', 'leader'] as UserRole[],

  // Forms permissions
  createForm: ['owner', 'admin', 'leader'] as UserRole[],
  editForm: ['owner', 'admin', 'leader'] as UserRole[],
  deleteForm: ['owner', 'admin', 'leader'] as UserRole[],
  viewFormResponses: ['owner', 'admin', 'leader'] as UserRole[],
  exportFormResponses: ['owner', 'admin', 'leader'] as UserRole[],
  submitInternalForm: ['owner', 'admin', 'leader', 'volunteer', 'member'] as UserRole[],

  // Settings permissions
  viewSettings: ['owner', 'admin'] as UserRole[],
  manageChurchSettings: ['owner', 'admin'] as UserRole[],
  manageCampuses: ['owner', 'admin'] as UserRole[],
  manageLocations: ['owner', 'admin'] as UserRole[],
  transferOwnership: ['owner'] as UserRole[],
} as const

export type FeatureKey = keyof typeof FEATURE_PERMISSIONS

/**
 * Check if a role has access to a specific page
 */
export function hasPageAccess(role: string, page: PageKey): boolean {
  const allowedRoles = PAGE_ACCESS[page]
  return allowedRoles?.includes(role as UserRole) ?? false
}

/**
 * Check if a role has a specific feature permission
 */
export function hasPermission(role: string, feature: FeatureKey): boolean {
  const allowedRoles = FEATURE_PERMISSIONS[feature]
  return allowedRoles?.includes(role as UserRole) ?? false
}

/**
 * Check if role is volunteer or below (volunteer, member)
 */
export function isVolunteerOrBelow(role: string): boolean {
  return role === 'volunteer' || role === 'member'
}

/**
 * Check if role is member only
 */
export function isMember(role: string): boolean {
  return role === 'member'
}

/**
 * Check if role is leader
 */
export function isLeader(role: string): boolean {
  return role === 'leader'
}

/**
 * Check if role is admin or owner
 */
export function isAdminOrOwner(role: string): boolean {
  return role === 'admin' || role === 'owner'
}

/**
 * Check if role is leader or above (leader, admin, owner)
 */
export function isLeaderOrAbove(role: string): boolean {
  return role === 'leader' || role === 'admin' || role === 'owner'
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as UserRole] ?? 0
}

/**
 * Check if sourceRole can modify targetRole (must be higher in hierarchy)
 */
export function canModifyRole(sourceRole: string, targetRole: string): boolean {
  return getRoleLevel(sourceRole) > getRoleLevel(targetRole)
}
