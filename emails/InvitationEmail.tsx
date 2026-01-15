import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { InvitationEmailTranslations } from '@/lib/email/translations'

// Default English translations for preview
const defaultTranslations: InvitationEmailTranslations = {
  subject: "You're invited to serve: {positionTitle} for {eventTitle}",
  preview: "You're invited to serve as {positionTitle} for {eventTitle}",
  heading: "You're Invited to Serve",
  greeting: "Hi {name},",
  intro: "You've been invited to serve at <strong>{churchName}</strong>:",
  acceptButton: "Accept Invitation",
  declineButton: "Decline",
  viewInApp: "Or <link>view this invitation in the app</link>",
  footer: "You received this email because you're a member of {churchName}.",
  footerUnsubscribe: "To stop receiving these emails, update your notification preferences in the app."
}

export interface InvitationEmailProps {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  positionTitle: string
  ministryName: string
  ministryColor: string
  acceptUrl: string
  declineUrl: string
  viewInAppUrl: string
  churchName: string
  translations?: InvitationEmailTranslations
}

// Escape HTML entities to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function InvitationEmail({
  recipientName,
  eventTitle,
  eventDate,
  eventTime,
  positionTitle,
  ministryName,
  ministryColor,
  acceptUrl,
  declineUrl,
  viewInAppUrl,
  churchName,
  translations = defaultTranslations,
}: InvitationEmailProps) {
  const t = translations

  // Helper to interpolate values with HTML escaping for safety
  const i = (template: string, params: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => escapeHtml(params[key] ?? ''))

  const previewText = i(t.preview, { positionTitle, eventTitle })
  const greetingText = i(t.greeting, { name: recipientName })
  const footerText = i(t.footer, { churchName })

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.heading}</Heading>

          <Text style={text}>{greetingText}</Text>

          <Text style={text} dangerouslySetInnerHTML={{
            __html: i(t.intro, { churchName })
          }} />

          <Section style={eventBox}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Text style={eventDetails}>{eventDate}</Text>
            <Text style={eventDetails}>{eventTime}</Text>
            <Hr style={hr} />
            <Text style={roleText}>
              <span style={{ ...ministryBadge, backgroundColor: ministryColor }}>
                {ministryName}
              </span>
              {' '}{positionTitle}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={acceptButton} href={acceptUrl}>
              {t.acceptButton}
            </Button>
          </Section>

          <Section style={buttonContainerSecondary}>
            <Button style={declineButton} href={declineUrl}>
              {t.declineButton}
            </Button>
          </Section>

          <Text style={orText}>
            {t.viewInApp.split('<link>')[0]}
            <Link href={viewInAppUrl} style={link}>
              {t.viewInApp.match(/<link>(.*?)<\/link>/)?.[1] || 'view this invitation in the app'}
            </Link>
            {t.viewInApp.split('</link>')[1] || ''}
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            {footerText}
            <br />
            {t.footerUnsubscribe}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '480px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const eventBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '20px',
  margin: '24px 0',
}

const eventTitleStyle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const eventDetails = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 4px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const roleText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const ministryBadge = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '500',
  padding: '2px 8px',
  borderRadius: '9999px',
  display: 'inline-block',
  marginRight: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
}

const buttonContainerSecondary = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const acceptButton = {
  backgroundColor: '#16a34a',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const declineButton = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '9999px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const orText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0',
}

export default InvitationEmail
