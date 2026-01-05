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

export interface InvitationResponseEmailProps {
  leaderName: string
  volunteerName: string
  response: 'accepted' | 'declined'
  positionTitle: string
  eventTitle: string
  eventDate: string
  ministryName: string
  viewEventUrl: string
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
}: InvitationResponseEmailProps) {
  const isAccepted = response === 'accepted'
  const emoji = isAccepted ? '✅' : '❌'
  const statusText = isAccepted ? 'Accepted' : 'Declined'
  const statusColor = isAccepted ? '#16a34a' : '#dc2626'

  return (
    <Html>
      <Head />
      <Preview>{volunteerName} {response} the invitation for {positionTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{emoji} Invitation {statusText}</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text}>
            <strong>{volunteerName}</strong> has <span style={{ color: statusColor, fontWeight: 600 }}>{response}</span> the invitation to serve:
          </Text>

          <Section style={eventBox}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Text style={eventDetails}>{eventDate}</Text>
            <Hr style={hr} />
            <Text style={roleText}>
              <span style={ministryBadge}>{ministryName}</span>
              {' '}{positionTitle}
            </Text>
          </Section>

          {!isAccepted && (
            <Text style={noteText}>
              You may need to find another volunteer for this position.
            </Text>
          )}

          <Section style={buttonContainer}>
            <Button style={viewButton} href={viewEventUrl}>
              View Event Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You received this email because you&apos;re the leader of {ministryName}.
            <br />
            To stop receiving these emails, update your notification preferences in the app.
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
