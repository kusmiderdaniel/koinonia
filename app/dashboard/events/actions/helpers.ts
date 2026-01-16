import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
  unwrapRelation,
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

/**
 * Check if a user can see an event based on their role and the event's visibility.
 *
 * Visibility rules:
 * - Admin/Owner: All events except hidden ones they're not invited to
 * - Leader: All events in their campuses (campus check happens elsewhere) + hidden if invited
 * - Volunteer: volunteers+ events, leaders+ only if they have an assignment, hidden if invited
 * - Member: Only members visibility events + hidden if invited
 *
 * @param userRole - The user's role
 * @param eventVisibility - The event's visibility setting (members, volunteers, leaders, hidden)
 * @param profileId - The user's profile ID
 * @param invitedProfileIds - Profile IDs invited to hidden events
 * @param hasAssignment - Whether the user has an assignment to this event (for volunteers seeing leader+ events)
 */
export function canUserSeeEvent(
  userRole: string,
  eventVisibility: string,
  profileId: string,
  invitedProfileIds: string[],
  hasAssignment: boolean = false
): boolean {
  // Hidden events - only visible if invited
  if (eventVisibility === 'hidden') {
    return invitedProfileIds.includes(profileId)
  }

  // Leaders visibility - leader+ can always see, volunteers only if assigned
  if (eventVisibility === 'leaders') {
    if (['leader', 'admin', 'owner'].includes(userRole)) {
      return true
    }
    if (userRole === 'volunteer') {
      return hasAssignment
    }
    return false // members can't see leader events
  }

  // Volunteers visibility - volunteers+ can see, members cannot
  if (eventVisibility === 'volunteers') {
    return ['volunteer', 'leader', 'admin', 'owner'].includes(userRole)
  }

  // Members visibility (default) - everyone can see
  return true
}

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireManagePermission, requireAdminPermission, unwrapRelation }
