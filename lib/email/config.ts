import { Resend } from 'resend'
import type { ReactElement } from 'react'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Koinonia <noreply@koinonia.app>'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
  attachments?: EmailAttachment[]
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send an email using Resend
 * Returns early if RESEND_API_KEY is not configured (development mode)
 * Supports optional file attachments (PDFs, etc.)
 */
export async function sendEmail({ to, subject, react, attachments }: SendEmailOptions): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set, skipping email send to:', to)
    return { success: false, error: 'Email not configured' }
  }

  try {
    // Build email options
    const emailOptions: Parameters<typeof resend.emails.send>[0] = {
      from: EMAIL_FROM,
      to,
      subject,
      react,
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailOptions.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
      }))
    }

    const { data, error } = await resend.emails.send(emailOptions)

    if (error) {
      console.error('[Email] Failed to send email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Sent successfully:', { to, subject, id: data?.id })
    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Email] Exception sending email:', message)
    return { success: false, error: message }
  }
}
