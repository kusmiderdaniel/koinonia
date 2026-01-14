import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/config'
import ChurchDeletionWarningEmail, {
  defaultTranslations,
  polishTranslations,
} from '@/emails/ChurchDeletionWarningEmail'
import { addDays, format } from 'date-fns'

interface SendWarningsResult {
  schedulesProcessed: number
  emailsSent: number
  errors: number
}

/**
 * Send warning emails to church members 10 days before church deletion.
 * Runs daily to find churches scheduled for deletion within 10 days
 * that haven't been notified yet.
 */
export async function sendChurchDeletionWarnings(): Promise<SendWarningsResult> {
  const adminClient = createServiceRoleClient()
  const now = new Date()
  const tenDaysFromNow = addDays(now, 10).toISOString()

  let schedulesProcessed = 0
  let emailsSent = 0
  let errors = 0

  // Find pending deletions within 10 days that haven't been notified
  const { data: pendingNotifications, error: fetchError } = await adminClient
    .from('church_deletion_schedules')
    .select(`
      id,
      church_id,
      scheduled_deletion_at,
      disagreement_id,
      church:churches(id, name),
      disagreement:legal_disagreements(user_id)
    `)
    .eq('status', 'pending')
    .is('member_notification_sent_at', null)
    .lt('scheduled_deletion_at', tenDaysFromNow)

  if (fetchError) {
    console.error('[Cron:DeletionWarnings] Error fetching pending notifications:', fetchError)
    return { schedulesProcessed: 0, emailsSent: 0, errors: 1 }
  }

  if (!pendingNotifications || pendingNotifications.length === 0) {
    console.log('[Cron:DeletionWarnings] No pending notifications to send')
    return { schedulesProcessed: 0, emailsSent: 0, errors: 0 }
  }

  console.log(`[Cron:DeletionWarnings] Found ${pendingNotifications.length} churches to notify`)

  for (const schedule of pendingNotifications) {
    schedulesProcessed++

    try {
      const churchData = schedule.church as Array<{ id: string; name: string }> | null
      const church = churchData?.[0]
      const churchName = church?.name || 'Your Church'

      const disagreementData = schedule.disagreement as Array<{ user_id: string }> | null
      const ownerUserId = disagreementData?.[0]?.user_id

      const deletionDate = new Date(schedule.scheduled_deletion_at)

      console.log(`[Cron:DeletionWarnings] Notifying members of ${churchName}`)

      // Get all members except the owner who initiated the disagreement
      let query = adminClient
        .from('profiles')
        .select(`
          id,
          first_name,
          user_id,
          users:user_id(email),
          language
        `)
        .eq('church_id', schedule.church_id)

      // Exclude the owner who initiated the disagreement
      if (ownerUserId) {
        query = query.neq('user_id', ownerUserId)
      }

      const { data: members, error: membersError } = await query

      if (membersError) {
        console.error(`[Cron:DeletionWarnings] Error fetching members for church ${schedule.church_id}:`, membersError)
        errors++
        continue
      }

      if (!members || members.length === 0) {
        console.log(`[Cron:DeletionWarnings] No members to notify for church ${schedule.church_id}`)
        // Mark as notified even if no members
        await adminClient
          .from('church_deletion_schedules')
          .update({
            status: 'notified',
            member_notification_sent_at: new Date().toISOString(),
          })
          .eq('id', schedule.id)
        continue
      }

      // Send emails to all members
      for (const member of members) {
        try {
          const userData = member.users as unknown as { email: string } | null
          const email = userData?.email

          if (!email) {
            console.warn(`[Cron:DeletionWarnings] No email for member ${member.id}`)
            continue
          }

          const language = (member.language as 'en' | 'pl') || 'en'
          const translations = language === 'pl' ? polishTranslations : defaultTranslations
          const formattedDate = format(deletionDate, 'PPP')

          await sendEmail({
            to: email,
            subject: language === 'pl'
              ? `Ważne: ${churchName} zostanie wkrótce usunięty`
              : `Important: ${churchName} will be deleted soon`,
            react: ChurchDeletionWarningEmail({
              recipientName: member.first_name || 'Member',
              churchName,
              deletionDate: formattedDate,
              translations,
            }),
          })

          emailsSent++

          // Small delay between emails to avoid rate limits
          if (emailsSent % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (emailError) {
          console.error(`[Cron:DeletionWarnings] Error sending email to member ${member.id}:`, emailError)
          errors++
        }
      }

      // Mark schedule as notified
      await adminClient
        .from('church_deletion_schedules')
        .update({
          status: 'notified',
          member_notification_sent_at: new Date().toISOString(),
        })
        .eq('id', schedule.id)

      console.log(`[Cron:DeletionWarnings] Notified ${members.length} members of ${churchName}`)
    } catch (error) {
      console.error(`[Cron:DeletionWarnings] Error processing schedule ${schedule.id}:`, error)
      errors++
    }
  }

  console.log(`[Cron:DeletionWarnings] Completed: ${schedulesProcessed} schedules processed, ${emailsSent} emails sent, ${errors} errors`)
  return { schedulesProcessed, emailsSent, errors }
}
