/**
 * Silent Acceptance Notification
 *
 * When a legal document with acceptance_type='silent' is published,
 * this sends email notifications to appropriate users with:
 * - PDF attachment of the full document
 * - Effective date and disagreement deadline
 * - Link to disagree with changes
 *
 * Recipients:
 * - Terms of Service / Privacy Policy → All users
 * - DPA / Church Admin Terms → Church owners only
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/config'
import { addDays, format } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import {
  SilentAcceptanceEmail,
  defaultTranslations,
  polishTranslations,
  type SilentAcceptanceEmailTranslations,
} from '@/emails/SilentAcceptanceEmail'
import {
  generateLegalDocumentPDF,
  generatePDFFilename,
  getDocumentTypeLabel,
} from '@/lib/pdf/legal-document'

interface DocumentInfo {
  id: string
  title: string
  content: string
  documentType: string
  version: number
  effectiveDate: string
  summary: string | null
  language: 'en' | 'pl'
}

// Deadlines in days after effective date
const DEADLINE_DAYS = {
  terms_of_service: 14,
  privacy_policy: 14,
  dpa: 30,
  church_admin_terms: 30,
}

const DOCUMENT_TYPE_LABELS: Record<string, Record<'en' | 'pl', string>> = {
  terms_of_service: { en: 'Terms of Service', pl: 'Regulamin' },
  privacy_policy: { en: 'Privacy Policy', pl: 'Polityka prywatności' },
  dpa: { en: 'Data Processing Agreement', pl: 'Umowa powierzenia przetwarzania danych' },
  church_admin_terms: { en: 'Church Administrator Terms', pl: 'Regulamin administratora kościoła' },
}

/**
 * Send silent acceptance notification emails with PDF attachments.
 * This is called when publishing a document with acceptance_type='silent'.
 *
 * Only sends to users whose language preference matches the document language.
 *
 * @param document - The legal document that was published
 * @returns Object with count of sent and failed emails
 */
export async function sendSilentAcceptanceNotifications(document: DocumentInfo) {
  const adminClient = createServiceRoleClient()

  // Determine recipients based on document type
  // ToS / Privacy Policy → All users with matching language
  // DPA / Church Admin Terms → Church owners only with matching language
  const isChurchOwnerDocument =
    document.documentType === 'dpa' || document.documentType === 'church_admin_terms'

  let users: Array<{
    id: string
    first_name: string
    email: string
    language: string | null
  }>

  if (isChurchOwnerDocument) {
    // Get only church owners with matching language
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, first_name, email, language')
      .eq('role', 'owner')
      .eq('language', document.language)
      .eq('receive_email_notifications', true)
      .not('email', 'is', null)

    if (error || !data) {
      console.error('[SilentAcceptance] Failed to fetch church owners:', error)
      return { sent: 0, failed: 0 }
    }
    users = data
  } else {
    // Get all users with matching language
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, first_name, email, language')
      .eq('language', document.language)
      .eq('receive_email_notifications', true)
      .not('email', 'is', null)

    if (error || !data) {
      console.error('[SilentAcceptance] Failed to fetch users:', error)
      return { sent: 0, failed: 0 }
    }
    users = data
  }

  if (users.length === 0) {
    console.log(`[SilentAcceptance] No recipients found for document "${document.title}" (language: ${document.language})`)
    return { sent: 0, failed: 0 }
  }

  console.log(`[SilentAcceptance] Found ${users.length} recipients for "${document.title}" (language: ${document.language})`)

  // Calculate deadline
  const effectiveDate = new Date(document.effectiveDate)
  const deadlineDays =
    DEADLINE_DAYS[document.documentType as keyof typeof DEADLINE_DAYS] || 14
  const deadline = addDays(effectiveDate, deadlineDays)

  // Generate PDF for the document
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateLegalDocumentPDF({
      title: document.title,
      content: document.content,
      version: document.version,
      effectiveDate: document.effectiveDate,
      language: document.language,
    })
    console.log('[SilentAcceptance] PDF generated for:', document.title)
  } catch (error) {
    console.error('[SilentAcceptance] Failed to generate PDF:', error)
    return { sent: 0, failed: 0 }
  }

  const pdfFilename = generatePDFFilename(
    document.documentType,
    document.version,
    document.language
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const viewUrl = `${siteUrl}/legal/${document.documentType.replace(/_/g, '-')}`
  const disagreeUrl = `${siteUrl}/legal/disagree?doc=${document.documentType}&id=${document.id}`

  // Format dates and labels using document language
  const dateFnsLocale = document.language === 'pl' ? pl : enUS
  const formattedEffectiveDate = format(effectiveDate, 'PPP', { locale: dateFnsLocale })
  const formattedDeadline = format(deadline, 'PPP', { locale: dateFnsLocale })
  const documentTypeLabel = DOCUMENT_TYPE_LABELS[document.documentType]?.[document.language] || document.documentType

  let sent = 0
  let failed = 0

  // Send emails in batches
  const BATCH_SIZE = 50
  const batches = Math.ceil(users.length / BATCH_SIZE)

  for (let i = 0; i < batches; i++) {
    const batch = users.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

    const emailPromises = batch.map(async (user) => {
      // Use document language (all users are filtered to match document language)
      const translations: SilentAcceptanceEmailTranslations =
        document.language === 'pl' ? polishTranslations : defaultTranslations

      // Interpolate subject
      const subject = translations.subject
        .replace('{documentTitle}', document.title)

      try {
        await sendEmail({
          to: user.email,
          subject,
          react: SilentAcceptanceEmail({
            recipientName: user.first_name,
            documentTitle: document.title,
            documentType: documentTypeLabel,
            effectiveDate: formattedEffectiveDate,
            disagreementDeadline: formattedDeadline,
            summaryOfChanges: document.summary,
            viewUrl,
            disagreeUrl,
            translations,
          }),
          attachments: [
            {
              filename: pdfFilename,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        })
        sent++
      } catch (error) {
        console.error(`[SilentAcceptance] Failed to send email to ${user.email}:`, error)
        failed++
      }
    })

    await Promise.all(emailPromises)

    // Delay between batches
    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Mark document as notified
  const { error: updateError } = await adminClient
    .from('legal_documents')
    .update({ silent_notification_sent_at: new Date().toISOString() })
    .eq('id', document.id)

  if (updateError) {
    console.error('[SilentAcceptance] Failed to update notification timestamp:', updateError)
  }

  console.log(
    `[SilentAcceptance] Notifications sent for "${document.title}": ${sent} sent, ${failed} failed`
  )

  return { sent, failed }
}
