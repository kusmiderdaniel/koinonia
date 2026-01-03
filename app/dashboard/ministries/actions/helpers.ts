import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'

// Re-export schemas from centralized location
export {
  ministrySchema,
  roleSchema,
  type MinistryInput,
  type RoleInput,
} from '@/lib/validations/ministry'

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireAdminPermission, requireManagePermission }
