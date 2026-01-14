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

export interface LegalDocumentUpdateEmailProps {
  recipientName: string
  documentTitle: string
  documentType: string
  summaryOfChanges: string | null
  reviewUrl: string
}

export function LegalDocumentUpdateEmail({
  recipientName,
  documentTitle,
  documentType,
  summaryOfChanges,
  reviewUrl,
}: LegalDocumentUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Important: {documentTitle} has been updated</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Updated Legal Document</Heading>

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>
            We&apos;ve updated our <strong>{documentTitle}</strong>. Please review
            and accept the new terms to continue using Koinonia.
          </Text>

          <Section style={documentBox}>
            <Text style={documentTitleStyle}>{documentTitle}</Text>
            <Text style={documentTypeStyle}>{documentType}</Text>
            {summaryOfChanges && (
              <>
                <Hr style={hr} />
                <Text style={summaryLabel}>Summary of Changes:</Text>
                <Text style={summaryText}>{summaryOfChanges}</Text>
              </>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Button style={reviewButton} href={reviewUrl}>
              Review & Accept
            </Button>
          </Section>

          <Text style={importantText}>
            You&apos;ll be asked to accept these updated terms the next time you
            log in to Koinonia.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This is an important legal notification from Koinonia.
            <br />
            Please review the updated document at your earliest convenience.
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

const documentBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
  padding: '20px',
  margin: '24px 0',
}

const documentTitleStyle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 4px',
}

const documentTypeStyle = {
  color: '#b45309',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const hr = {
  borderColor: '#fcd34d',
  margin: '16px 0',
}

const summaryLabel = {
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '600',
  lineHeight: '16px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const summaryText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const reviewButton = {
  backgroundColor: '#f49f1e',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const importantText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0',
}

export default LegalDocumentUpdateEmail
