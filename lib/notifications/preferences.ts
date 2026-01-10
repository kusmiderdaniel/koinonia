import {
  type NotificationPreferences,
  type NotificationPreferenceKey,
  type NotificationChannel,
  type ReminderChannel,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notification-preferences'

/**
 * Parse notification preferences from JSONB, applying defaults for missing fields.
 * Handles both empty {} and partial preference objects.
 */
export function parseNotificationPreferences(
  json: unknown
): NotificationPreferences {
  // If null, undefined, or not an object, return defaults
  if (!json || typeof json !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  }

  const raw = json as Record<string, unknown>

  // Helper to parse a channel with defaults
  const parseChannel = (
    key: string,
    defaultValue: NotificationChannel
  ): NotificationChannel => {
    const value = raw[key]
    if (!value || typeof value !== 'object') {
      return { ...defaultValue }
    }
    const channel = value as Record<string, unknown>
    return {
      in_app: typeof channel.in_app === 'boolean' ? channel.in_app : defaultValue.in_app,
      email: typeof channel.email === 'boolean' ? channel.email : defaultValue.email,
      push: typeof channel.push === 'boolean' ? channel.push : defaultValue.push,
    }
  }

  // Helper to parse a reminder channel with defaults
  const parseReminderChannel = (
    key: string,
    defaultValue: ReminderChannel
  ): ReminderChannel => {
    const value = raw[key]
    if (!value || typeof value !== 'object') {
      return { ...defaultValue }
    }
    const channel = value as Record<string, unknown>
    return {
      in_app: typeof channel.in_app === 'boolean' ? channel.in_app : defaultValue.in_app,
      email: typeof channel.email === 'boolean' ? channel.email : defaultValue.email,
      push: typeof channel.push === 'boolean' ? channel.push : defaultValue.push,
      days_before:
        typeof channel.days_before === 'number' && channel.days_before > 0
          ? channel.days_before
          : defaultValue.days_before,
    }
  }

  // Handle migration from old keys (ministry_invitation_responses, event_invitation_responses)
  // to new split keys (accepted/declined). If old key exists, use it as default for both.
  const legacyMinistry = raw['ministry_invitation_responses'] as Record<string, unknown> | undefined
  const legacyEvent = raw['event_invitation_responses'] as Record<string, unknown> | undefined

  const ministryAcceptedDefault = legacyMinistry
    ? {
        in_app: typeof legacyMinistry.in_app === 'boolean' ? legacyMinistry.in_app : true,
        email: typeof legacyMinistry.email === 'boolean' ? legacyMinistry.email : true,
        push: typeof legacyMinistry.push === 'boolean' ? legacyMinistry.push : true,
      }
    : DEFAULT_NOTIFICATION_PREFERENCES.ministry_invitation_accepted

  const ministryDeclinedDefault = legacyMinistry
    ? {
        in_app: typeof legacyMinistry.in_app === 'boolean' ? legacyMinistry.in_app : true,
        email: typeof legacyMinistry.email === 'boolean' ? legacyMinistry.email : true,
        push: typeof legacyMinistry.push === 'boolean' ? legacyMinistry.push : true,
      }
    : DEFAULT_NOTIFICATION_PREFERENCES.ministry_invitation_declined

  const eventAcceptedDefault = legacyEvent
    ? {
        in_app: typeof legacyEvent.in_app === 'boolean' ? legacyEvent.in_app : true,
        email: typeof legacyEvent.email === 'boolean' ? legacyEvent.email : true,
        push: typeof legacyEvent.push === 'boolean' ? legacyEvent.push : true,
      }
    : DEFAULT_NOTIFICATION_PREFERENCES.event_invitation_accepted

  const eventDeclinedDefault = legacyEvent
    ? {
        in_app: typeof legacyEvent.in_app === 'boolean' ? legacyEvent.in_app : true,
        email: typeof legacyEvent.email === 'boolean' ? legacyEvent.email : true,
        push: typeof legacyEvent.push === 'boolean' ? legacyEvent.push : true,
      }
    : DEFAULT_NOTIFICATION_PREFERENCES.event_invitation_declined

  return {
    ministry_invitation_accepted: parseChannel(
      'ministry_invitation_accepted',
      ministryAcceptedDefault
    ),
    ministry_invitation_declined: parseChannel(
      'ministry_invitation_declined',
      ministryDeclinedDefault
    ),
    event_invitation_accepted: parseChannel(
      'event_invitation_accepted',
      eventAcceptedDefault
    ),
    event_invitation_declined: parseChannel(
      'event_invitation_declined',
      eventDeclinedDefault
    ),
    pending_member_registrations: parseChannel(
      'pending_member_registrations',
      DEFAULT_NOTIFICATION_PREFERENCES.pending_member_registrations
    ),
    unfilled_positions_reminder: parseReminderChannel(
      'unfilled_positions_reminder',
      DEFAULT_NOTIFICATION_PREFERENCES.unfilled_positions_reminder
    ),
  }
}

/**
 * Check if a notification should be sent based on user preferences.
 *
 * @param prefs - User's notification preferences
 * @param type - The notification preference key to check
 * @param channel - 'in_app', 'email', or 'push'
 * @returns boolean indicating if notification should be sent
 */
export function shouldNotify(
  prefs: NotificationPreferences,
  type: NotificationPreferenceKey,
  channel: 'in_app' | 'email' | 'push'
): boolean {
  const preference = prefs[type]
  return preference ? preference[channel] : true // Default to true if not set
}

/**
 * Get the days_before value for unfilled positions reminder.
 *
 * @param prefs - User's notification preferences
 * @returns number of days before event to send reminder
 */
export function getReminderDaysBefore(prefs: NotificationPreferences): number {
  return prefs.unfilled_positions_reminder?.days_before ?? 3
}

/**
 * Check if unfilled positions reminder should be sent for a given event date.
 *
 * @param prefs - User's notification preferences
 * @param eventDate - The event's start date
 * @param today - Current date (for testing, defaults to now)
 * @returns boolean indicating if reminder should be sent today
 */
export function shouldSendUnfilledReminder(
  prefs: NotificationPreferences,
  eventDate: Date,
  today: Date = new Date()
): boolean {
  const daysBefore = getReminderDaysBefore(prefs)

  // Calculate days between today and event
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const eventStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

  const diffTime = eventStart.getTime() - todayStart.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Send reminder if event is exactly X days away
  return diffDays === daysBefore
}
