// Notification preference types for leaders, admins, and owners

/**
 * Channel toggles for a notification type
 */
export type NotificationChannel = {
  in_app: boolean
  email: boolean
  push: boolean
}

/**
 * Channel toggles with days_before for reminder-type notifications
 */
export type ReminderChannel = NotificationChannel & {
  days_before: number
}

/**
 * Available notification preference keys
 */
export type NotificationPreferenceKey =
  | 'ministry_invitation_accepted'
  | 'ministry_invitation_declined'
  | 'event_invitation_accepted'
  | 'event_invitation_declined'
  | 'pending_member_registrations'
  | 'unfilled_positions_reminder'

/**
 * Full notification preferences structure stored in profiles.notification_preferences JSONB
 */
export type NotificationPreferences = {
  ministry_invitation_accepted: NotificationChannel
  ministry_invitation_declined: NotificationChannel
  event_invitation_accepted: NotificationChannel
  event_invitation_declined: NotificationChannel
  pending_member_registrations: NotificationChannel
  unfilled_positions_reminder: ReminderChannel
}

/**
 * Options for days_before dropdown in unfilled positions reminder
 */
export const REMINDER_DAYS_OPTIONS = [1, 2, 3, 5, 7] as const
export type ReminderDaysOption = (typeof REMINDER_DAYS_OPTIONS)[number]

/**
 * Default preferences - all notifications enabled
 * Used when a user has no preferences set or for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  ministry_invitation_accepted: { in_app: true, email: true, push: true },
  ministry_invitation_declined: { in_app: true, email: true, push: true },
  event_invitation_accepted: { in_app: true, email: true, push: true },
  event_invitation_declined: { in_app: true, email: true, push: true },
  pending_member_registrations: { in_app: true, email: true, push: true },
  unfilled_positions_reminder: { in_app: true, email: true, push: true, days_before: 3 },
}
