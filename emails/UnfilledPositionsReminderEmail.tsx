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

export interface UnfilledPosition {
  positionTitle: string
  ministryName: string
  status: 'unfilled' | 'declined'
}

export interface UnfilledPositionsReminderEmailProps {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  positions: UnfilledPosition[]
  viewEventUrl: string
  churchName: string
}

export function UnfilledPositionsReminderEmail({
  recipientName,
  eventTitle,
  eventDate,
  eventTime,
  positions,
  viewEventUrl,
  churchName,
}: UnfilledPositionsReminderEmailProps) {
  const unfilledCount = positions.filter((p) => p.status === 'unfilled').length
  const declinedCount = positions.filter((p) => p.status === 'declined').length

  return (
    <Html>
      <Head />
      <Preview>
        {`${positions.length} position${positions.length > 1 ? 's' : ''} need${positions.length === 1 ? 's' : ''} attention for ${eventTitle}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Positions Need Attention</Heading>

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>
            The following event has positions that still need to be filled:
          </Text>

          <Section style={eventBox}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Text style={eventDetails}>{eventDate}</Text>
            <Text style={eventDetails}>{eventTime}</Text>
          </Section>

          <Section style={summaryBox}>
            {unfilledCount > 0 && (
              <Text style={summaryItem}>
                <span style={unfilledBadge}>{unfilledCount} unfilled</span>
              </Text>
            )}
            {declinedCount > 0 && (
              <Text style={summaryItem}>
                <span style={declinedBadge}>{declinedCount} declined</span>
              </Text>
            )}
          </Section>

          <Section style={positionsSection}>
            <Text style={positionsHeader}>Positions:</Text>
            {positions.map((position, index) => (
              <Section key={index} style={positionRow}>
                <Text style={positionText}>
                  <span style={position.status === 'unfilled' ? unfilledDot : declinedDot}>
                    {position.status === 'unfilled' ? '○' : '✕'}
                  </span>
                  {' '}
                  <strong>{position.positionTitle}</strong>
                  {' '}
                  <span style={ministryText}>({position.ministryName})</span>
                </Text>
              </Section>
            ))}
          </Section>

          <Section style={buttonContainer}>
            <Button style={viewButton} href={viewEventUrl}>
              View Event & Fill Positions
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You received this email because you manage events for {churchName}.
            <br />
            To stop receiving these reminders, update your notification preferences in the app.
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
  maxWidth: '520px',
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
  textAlign: 'center' as const,
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

const summaryBox = {
  textAlign: 'center' as const,
  margin: '16px 0',
}

const summaryItem = {
  display: 'inline-block',
  margin: '0 8px',
}

const unfilledBadge = {
  color: '#92400e',
  backgroundColor: '#fef3c7',
  fontSize: '14px',
  fontWeight: '600',
  padding: '4px 12px',
  borderRadius: '9999px',
  display: 'inline-block',
}

const declinedBadge = {
  color: '#991b1b',
  backgroundColor: '#fee2e2',
  fontSize: '14px',
  fontWeight: '600',
  padding: '4px 12px',
  borderRadius: '9999px',
  display: 'inline-block',
}

const positionsSection = {
  margin: '24px 0',
}

const positionsHeader = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const positionRow = {
  margin: '0 0 8px',
}

const positionText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const unfilledDot = {
  color: '#d97706',
}

const declinedDot = {
  color: '#dc2626',
}

const ministryText = {
  color: '#9ca3af',
  fontSize: '13px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
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

export default UnfilledPositionsReminderEmail
