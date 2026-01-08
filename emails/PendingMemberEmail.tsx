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

export interface PendingMemberEmailProps {
  recipientName: string
  memberName: string
  memberEmail: string
  churchName: string
  reviewUrl: string
}

export function PendingMemberEmail({
  recipientName,
  memberName,
  memberEmail,
  churchName,
  reviewUrl,
}: PendingMemberEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New member request: {memberName} wants to join {churchName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Member Request</Heading>

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>
            Someone has requested to join <strong>{churchName}</strong> and is waiting for approval.
          </Text>

          <Section style={memberBox}>
            <Text style={memberNameStyle}>{memberName}</Text>
            <Text style={memberEmailStyle}>{memberEmail}</Text>
          </Section>

          <Text style={text}>
            Please review this request and approve or reject the membership.
          </Text>

          <Section style={buttonContainer}>
            <Button style={reviewButton} href={reviewUrl}>
              Review Request
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You received this email because you&apos;re an admin of {churchName}.
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

const memberBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const memberNameStyle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 4px',
}

const memberEmailStyle = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const reviewButton = {
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

export default PendingMemberEmail
