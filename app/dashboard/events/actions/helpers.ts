import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

// Re-export schemas from centralized location
export {
  eventSchema,
  positionSchema,
  type EventInput,
  type PositionInput,
} from '@/lib/validations/event'

export {
  agendaItemSchema,
  type AgendaItemInput,
} from '@/lib/validations/agenda-item'

// ============ HELPER FUNCTIONS ============

export function canUserSeeEvent(
  userRole: string,
  eventVisibility: string,
  profileId: string,
  invitedProfileIds: string[]
): boolean {
  if (eventVisibility === 'hidden') {
    return invitedProfileIds.includes(profileId)
  }
  if (eventVisibility === 'leaders') {
    return ['leader', 'admin', 'owner'].includes(userRole)
  }
  if (eventVisibility === 'volunteers') {
    return ['volunteer', 'leader', 'admin', 'owner'].includes(userRole)
  }
  return true
}

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireManagePermission, requireAdminPermission }
