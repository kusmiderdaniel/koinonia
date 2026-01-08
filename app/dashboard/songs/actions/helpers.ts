import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyNestedOwnership,
} from '@/lib/utils/server-auth'

// Re-export schemas from centralized location
export {
  songSchema,
  tagSchema,
  type SongInput,
  type TagInput,
} from '@/lib/validations/song'

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireManagePermission, verifyNestedOwnership }
