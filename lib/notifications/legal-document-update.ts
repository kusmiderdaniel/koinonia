import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/config'
import { LegalDocumentUpdateEmail } from '@/emails/LegalDocumentUpdateEmail'

interface DocumentInfo {
  id: string
  title: string
  documentType: string
  summary: string | null
}

const DOCUMENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: {
    terms_of_service: 'Terms of Service',
    privacy_policy: 'Privacy Policy',
    dpa: 'Data Processing Agreement',
    church_admin_terms: 'Church Administrator Terms',
  },
  pl: {
    terms_of_service: 'Regulamin',
    privacy_policy: 'Polityka Prywatności',
    dpa: 'Umowa Powierzenia Danych',
    church_admin_terms: 'Regulamin Administratora Kościoła',
  },
}

const EMAIL_SUBJECTS: Record<string, (title: string) => string> = {
  en: (title: string) => `Important: ${title} has been updated`,
  pl: (title: string) => `Ważne: ${title} został zaktualizowany`,
}

/**
 * Send email notifications to all users about a legal document update.
 * Only sends to users who have email notifications enabled.
 * Emails are sent in each user's preferred language.
 * This is an optional notification when publishing active-acceptance documents.
 */
export async function notifyUsersOfDocumentUpdate(document: DocumentInfo) {
  const adminClient = createServiceRoleClient()

  // Get all users who have email notifications enabled, including their language preference
  const { data: users, error: fetchError } = await adminClient
    .from('profiles')
    .select('id, first_name, email, receive_email_notifications, language')
    .eq('receive_email_notifications', true)
    .not('email', 'is', null)

  if (fetchError || !users || users.length === 0) {
    console.error(
      '[Notification] Failed to fetch users for legal document notification:',
      fetchError
    )
    return { sent: 0, failed: 0 }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const reviewUrl = `${siteUrl}/legal/reconsent`

  let sent = 0
  let failed = 0

  // Send emails in batches to avoid overwhelming the email service
  const BATCH_SIZE = 50
  const batches = Math.ceil(users.length / BATCH_SIZE)

  for (let i = 0; i < batches; i++) {
    const batch = users.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

    const emailPromises = batch.map((user) => {
      // Determine user's language preference (default to 'en')
      const language = (user.language === 'pl' ? 'pl' : 'en') as 'en' | 'pl'

      // Get localized document type label
      const documentTypeLabel =
        DOCUMENT_TYPE_LABELS[language]?.[document.documentType] ||
        DOCUMENT_TYPE_LABELS['en'][document.documentType] ||
        document.documentType

      // Get localized email subject
      const subject = EMAIL_SUBJECTS[language](document.title)

      return sendEmail({
        to: user.email,
        subject,
        react: LegalDocumentUpdateEmail({
          recipientName: user.first_name,
          documentTitle: document.title,
          documentType: documentTypeLabel,
          summaryOfChanges: document.summary,
          reviewUrl,
          language,
        }),
      })
        .then(() => {
          sent++
        })
        .catch((err) => {
          console.error(`[Email] Failed to send legal update email to ${user.email}:`, err)
          failed++
        })
    })

    // Wait for batch to complete before starting next batch
    await Promise.all(emailPromises)

    // Add a small delay between batches
    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log(
    `[Notification] Legal document update emails: ${sent} sent, ${failed} failed`
  )

  return { sent, failed }
}
