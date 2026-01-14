'use server'

import { format, type Locale } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import { sendEmail } from '@/lib/email/config'
import { InvitationResponseEmail } from '@/emails/InvitationResponseEmail'
import { getEmailTranslations, interpolate } from '@/lib/email/translations'
import {
  parseNotificationPreferences,
  shouldNotify,
} from '@/lib/notifications/preferences'
import { sendPushToUser } from '@/lib/push/send'

// Map locale strings to date-fns locales
const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  pl: pl,
}

// Type definitions for notification recipients
type RecipientData = {
  id: string
  first_name: string
  email: string | null
  receive_email_notifications: boolean
  notification_preferences: unknown
  language: string | null
}

type ProfileData = { id: string; first_name: string; last_name: string }

type MinistryData = {
  id: string
  name: string
  leader_id: string | null
  leader: RecipientData | RecipientData[] | null
}

type ChurchData = {
  name: string
}

type EventData = {
  id: string
  title: string
  start_time: string
  church_id: string
  church: ChurchData | ChurchData[] | null
  responsible_person_id: string | null
  responsible_person: RecipientData | RecipientData[] | null
}

type PositionData = {
  id: string
  title: string
  ministry: MinistryData | MinistryData[] | null
  event: EventData | EventData[]
}

type AssignmentWithDetails = {
  id: string
  profile_id: string
  profile: ProfileData | ProfileData[] | null
  position: PositionData
}

/**
 * Helper function to unwrap Supabase relation (array or single object)
 */
function unwrapRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (relation === null || relation === undefined) return null
  if (Array.isArray(relation)) return relation[0] ?? null
  return relation
}

/**
 * Send notification to a single recipient based on their preferences
 */
async function sendNotificationToRecipient(
  adminClient: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceRoleClient>>,
  recipient: RecipientData,
  preferenceKey: 'ministry_invitation_accepted' | 'ministry_invitation_declined' | 'event_invitation_accepted' | 'event_invitation_declined',
  notificationData: {
    churchId: string
    churchName: string
    eventId: string
    assignmentId: string
    positionTitle: string
    eventTitle: string
    eventStartTime: string
    ministryName: string
    responderName: string
    response: 'accepted' | 'declined'
  }
) {
  const prefs = parseNotificationPreferences(recipient.notification_preferences)
  const responseVerb = notificationData.response === 'accepted' ? 'accepted' : 'declined'
  const responseEmoji = notificationData.response === 'accepted' ? '✅' : '❌'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Get recipient's language preference and translations
  const userLocale = recipient.language || 'en'
  const emailTranslations = getEmailTranslations(userLocale)
  const dateFnsLocale = dateFnsLocales[userLocale] || enUS
  const eventDate = format(new Date(notificationData.eventStartTime), 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })

  // Check in-app notification preference
  if (shouldNotify(prefs, preferenceKey, 'in_app')) {
    const { error: notifyError } = await adminClient
      .from('notifications')
      .insert({
        church_id: notificationData.churchId,
        recipient_id: recipient.id,
        type: 'invitation_response',
        title: `${responseEmoji} Invitation ${responseVerb}`,
        message: `${notificationData.responderName} has ${responseVerb} the invitation to serve as "${notificationData.positionTitle}" for "${notificationData.eventTitle}"`,
        event_id: notificationData.eventId,
        assignment_id: notificationData.assignmentId,
      })

    if (notifyError) {
      console.error('[Notification] Failed to create notification:', notifyError)
    }
  }

  // Check email notification preference
  if (
    recipient.email &&
    recipient.receive_email_notifications &&
    shouldNotify(prefs, preferenceKey, 'email')
  ) {
    const t = emailTranslations.invitationResponse
    const isAccepted = notificationData.response === 'accepted'
    const subject = interpolate(isAccepted ? t.acceptedSubject : t.declinedSubject, {
      name: notificationData.responderName,
      positionTitle: notificationData.positionTitle,
      eventTitle: notificationData.eventTitle,
    })

    sendEmail({
      to: recipient.email,
      subject: `${responseEmoji} ${subject}`,
      react: InvitationResponseEmail({
        leaderName: recipient.first_name,
        volunteerName: notificationData.responderName,
        response: responseVerb,
        positionTitle: notificationData.positionTitle,
        eventTitle: notificationData.eventTitle,
        eventDate,
        ministryName: notificationData.ministryName,
        viewEventUrl: `${siteUrl}/dashboard/events/${notificationData.eventId}`,
        churchName: notificationData.churchName,
        translations: t,
      }),
    }).catch((err) => console.error('[Email] Failed to send notification email:', err))
  }

  // Check push notification preference
  if (shouldNotify(prefs, preferenceKey, 'push')) {
    sendPushToUser(recipient.id, {
      title: `${responseEmoji} Invitation ${responseVerb}`,
      body: `${notificationData.responderName} has ${responseVerb} "${notificationData.positionTitle}" for "${notificationData.eventTitle}"`,
      data: {
        type: 'invitation_response',
        event_id: notificationData.eventId,
      },
    }).catch((err) => console.error('[Push] Failed to send response notification:', err))
  }
}

/**
 * Notify the ministry leader and event responsible person when a volunteer accepts or declines an invitation.
 * This is called from both the in-app response and email-based response.
 * Respects user notification preferences.
 */
export async function notifyMinistryLeaderOfResponse(
  adminClient: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceRoleClient>>,
  assignmentId: string,
  response: 'accepted' | 'declined',
  responder?: { id: string; first_name: string; last_name: string }
) {
  // Get assignment with position, ministry leader, event details, and responsible person
  const { data: assignment, error: fetchError } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      profile_id,
      profile:profiles!event_assignments_profile_id_fkey (
        id,
        first_name,
        last_name
      ),
      position:event_positions!inner (
        id,
        title,
        ministry:ministries (
          id,
          name,
          leader_id,
          leader:profiles!ministries_leader_id_fkey (
            id,
            first_name,
            email,
            receive_email_notifications,
            notification_preferences,
            language
          )
        ),
        event:events!inner (
          id,
          title,
          start_time,
          church_id,
          church:churches (
            name
          ),
          responsible_person_id,
          responsible_person:profiles!events_responsible_person_id_fkey (
            id,
            first_name,
            email,
            receive_email_notifications,
            notification_preferences,
            language
          )
        )
      )
    `)
    .eq('id', assignmentId)
    .single()

  if (fetchError || !assignment) {
    console.error('[Notification] Failed to fetch assignment for leader notification:', fetchError)
    return
  }

  // Type and unwrap the nested data
  const typedAssignment = assignment as unknown as AssignmentWithDetails
  const position = typedAssignment.position
  const ministry = unwrapRelation(position.ministry)
  const event = unwrapRelation(position.event)

  if (!event) {
    console.error('[Notification] Event not found for assignment')
    return
  }

  const ministryLeader = ministry?.leader ? unwrapRelation(ministry.leader) : null
  const eventResponsible = event.responsible_person ? unwrapRelation(event.responsible_person) : null
  const church = event.church ? unwrapRelation(event.church) : null

  // Get the responder's name
  let responderName: string
  if (responder) {
    responderName = `${responder.first_name} ${responder.last_name}`
  } else {
    const profile = unwrapRelation(typedAssignment.profile)
    responderName = profile ? `${profile.first_name} ${profile.last_name}` : 'A volunteer'
  }

  // Track who we've already notified to avoid duplicates
  const notifiedIds = new Set<string>()

  // Determine the preference keys based on response type
  const ministryPreferenceKey = response === 'accepted'
    ? 'ministry_invitation_accepted' as const
    : 'ministry_invitation_declined' as const
  const eventPreferenceKey = response === 'accepted'
    ? 'event_invitation_accepted' as const
    : 'event_invitation_declined' as const

  // Prepare notification data
  const notificationData = {
    churchId: event.church_id,
    churchName: church?.name || 'Your Church',
    eventId: event.id,
    assignmentId,
    positionTitle: position.title,
    eventTitle: event.title,
    eventStartTime: event.start_time,
    ministryName: ministry?.name || 'Ministry',
    responderName,
    response,
  }

  // Notify ministry leader
  if (ministryLeader?.id && !notifiedIds.has(ministryLeader.id)) {
    notifiedIds.add(ministryLeader.id)
    await sendNotificationToRecipient(adminClient, ministryLeader, ministryPreferenceKey, notificationData)
  }

  // Notify event responsible person
  if (eventResponsible?.id && !notifiedIds.has(eventResponsible.id)) {
    notifiedIds.add(eventResponsible.id)
    await sendNotificationToRecipient(adminClient, eventResponsible, eventPreferenceKey, notificationData)
  }
}
