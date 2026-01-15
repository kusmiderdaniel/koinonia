import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { InvitationResponseEmailTranslations } from '@/lib/email/translations'

// Default English translations for preview
const defaultTranslations: InvitationResponseEmailTranslations = {
  acceptedSubject: "{name} accepted: {positionTitle} for {eventTitle}",
  declinedSubject: "{name} declined: {positionTitle} for {eventTitle}",
  acceptedPreview: "{name} has accepted to serve as {positionTitle}",
  declinedPreview: "{name} has declined to serve as {positionTitle}",
  acceptedHeading: "Invitation Accepted",
  declinedHeading: "Invitation Declined",
  acceptedIntro: "<strong>{name}</strong> has accepted to serve:",
  declinedIntro: "<strong>{name}</strong> has declined to serve:",
  viewEvent: "View Event",
  footer: "You received this email because you manage events at {churchName}."
}

export interface InvitationResponseEmailProps {
  leaderName: string
  volunteerName: string
  response: 'accepted' | 'declined'
  positionTitle: string
  eventTitle: string
  eventDate: string
  ministryName: string
  viewEventUrl: string
  churchName?: string
  translations?: InvitationResponseEmailTranslations
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

export function InvitationResponseEmail({
  leaderName,
  volunteerName,
  response,
  positionTitle,
  eventTitle,
  eventDate,
  ministryName,
  viewEventUrl,
  churchName = 'Your Church',
  translations = defaultTranslations,
}: InvitationResponseEmailProps) {
  const t = translations
  const isAccepted = response === 'accepted'
  const emoji = isAccepted ? '✅' : '❌'

  // Helper to interpolate values with HTML escaping for safety
  const i = (template: string, params: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => escapeHtml(params[key] ?? ''))

  const heading = isAccepted ? t.acceptedHeading : t.declinedHeading
  const previewText = i(isAccepted ? t.acceptedPreview : t.declinedPreview, {
    name: volunteerName,
    positionTitle,
  })
  const introText = i(isAccepted ? t.acceptedIntro : t.declinedIntro, {
    name: volunteerName,
  })
  const footerText = i(t.footer, { churchName })

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{emoji} {heading}</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text} dangerouslySetInnerHTML={{ __html: introText }} />

          <Section style={eventBox}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Text style={eventDetails}>{eventDate}</Text>
            <Hr style={hr} />
            <Text style={roleText}>
              <span style={ministryBadge}>{ministryName}</span>
              {' '}{positionTitle}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={viewButton} href={viewEventUrl}>
              {t.viewEvent}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>{footerText}</Text>
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
  backgroundColor: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  padding: '2px 8px',
  borderRadius: '9999px',
  display: 'inline-block',
  marginRight: '8px',
}

const noteText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  fontStyle: 'italic',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const viewButton = {
  backgroundColor: '#2563eb',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0',
}

export default InvitationResponseEmail
