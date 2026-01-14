/**
 * Email translation helper
 *
 * Provides translated strings for email templates based on user's language preference.
 * Falls back to English if the requested language is not available.
 */

import enEmails from '@/messages/en/emails.json'
import plEmails from '@/messages/pl/emails.json'

type SupportedLocale = 'en' | 'pl'
type EmailMessages = typeof enEmails

const translations: Record<SupportedLocale, EmailMessages> = {
  en: enEmails,
  pl: plEmails,
}

/**
 * Get email translations for a specific locale
 */
export function getEmailTranslations(locale: string | null | undefined): EmailMessages {
  const normalizedLocale = (locale?.toLowerCase() || 'en') as SupportedLocale
  return translations[normalizedLocale] || translations.en
}

/**
 * Simple string interpolation for translation strings
 * Replaces {key} placeholders with values from the params object
 */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() ?? match
  })
}

// Type exports for email components
export type InvitationEmailTranslations = EmailMessages['invitation']
export type InvitationResponseEmailTranslations = EmailMessages['invitationResponse']
export type PendingMemberEmailTranslations = EmailMessages['pendingMember']
export type UnfilledPositionsEmailTranslations = EmailMessages['unfilledPositions']
export type LegalDocumentUpdateEmailTranslations = EmailMessages['legalDocumentUpdate']
export type CommonEmailTranslations = EmailMessages['common']
