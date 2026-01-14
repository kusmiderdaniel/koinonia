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

export interface SilentAcceptanceEmailTranslations {
  subject: string
  preview: string
  heading: string
  greeting: string
  intro: string
  effectiveDateLabel: string
  deadlineLabel: string
  deadlineExplanation: string
  pdfAttached: string
  disagreeButton: string
  continueUsing: string
  footer: string
  footerDisclaimer: string
}

export const defaultTranslations: SilentAcceptanceEmailTranslations = {
  subject: 'Updated {documentTitle} - Review Required',
  preview: 'Important changes to {documentTitle} - Review before {deadline}',
  heading: 'Legal Document Updated',
  greeting: 'Hi {name},',
  intro: "We've made changes to our <strong>{documentTitle}</strong>. Please review the attached document and the summary below.",
  effectiveDateLabel: 'Effective Date',
  deadlineLabel: 'Disagreement Deadline',
  deadlineExplanation: 'If you have concerns about these changes, you must express your disagreement before this date.',
  pdfAttached: 'The full document is attached to this email as a PDF.',
  disagreeButton: 'Disagree with Changes',
  continueUsing: 'If you continue using Koinonia after {effectiveDate}, you accept these changes.',
  footer: 'This is an important legal notification from Koinonia.',
  footerDisclaimer: 'You received this email because you are a user of Koinonia.',
}

export const polishTranslations: SilentAcceptanceEmailTranslations = {
  subject: 'Zaktualizowano {documentTitle} - Wymagana weryfikacja',
  preview: 'Ważne zmiany w {documentTitle} - Sprawdź przed {deadline}',
  heading: 'Dokument prawny zaktualizowany',
  greeting: 'Cześć {name},',
  intro: 'Wprowadziliśmy zmiany w naszym dokumencie <strong>{documentTitle}</strong>. Prosimy o zapoznanie się z załączonym dokumentem i poniższym podsumowaniem.',
  effectiveDateLabel: 'Data wejścia w życie',
  deadlineLabel: 'Termin na zgłoszenie sprzeciwu',
  deadlineExplanation: 'Jeśli masz zastrzeżenia do tych zmian, musisz zgłosić swój sprzeciw przed tą datą.',
  pdfAttached: 'Pełny dokument jest załączony do tej wiadomości jako PDF.',
  disagreeButton: 'Zgłoś sprzeciw',
  continueUsing: 'Jeśli będziesz nadal korzystać z Koinonia po {effectiveDate}, akceptujesz te zmiany.',
  footer: 'Jest to ważne powiadomienie prawne od Koinonia.',
  footerDisclaimer: 'Otrzymujesz tę wiadomość, ponieważ jesteś użytkownikiem Koinonia.',
}

export interface SilentAcceptanceEmailProps {
  recipientName: string
  documentTitle: string
  documentType: string
  effectiveDate: string
  disagreementDeadline: string
  summaryOfChanges: string | null
  disagreeUrl: string
  translations?: SilentAcceptanceEmailTranslations
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`)
}

export function SilentAcceptanceEmail({
  recipientName,
  documentTitle,
  documentType,
  effectiveDate,
  disagreementDeadline,
  summaryOfChanges,
  disagreeUrl,
  translations = defaultTranslations,
}: SilentAcceptanceEmailProps) {
  const t = translations
  const values = {
    name: recipientName,
    documentTitle,
    effectiveDate,
    deadline: disagreementDeadline,
  }

  return (
    <Html>
      <Head />
      <Preview>{interpolate(t.preview, values)}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logoText}>KOINONIA</Text>
          </Section>

          <Heading style={h1}>{t.heading}</Heading>

          <Text style={text}>{interpolate(t.greeting, values)}</Text>

          <Text
            style={text}
            dangerouslySetInnerHTML={{
              __html: interpolate(t.intro, values),
            }}
          />

          {/* Document info box */}
          <Section style={documentBox}>
            <Text style={documentTitleStyle}>{documentTitle}</Text>
            <Text style={documentTypeStyle}>{documentType}</Text>

            <Hr style={hr} />

            {/* Important dates */}
            <Section style={dateRow}>
              <Text style={dateLabel}>{t.effectiveDateLabel}</Text>
              <Text style={dateValue}>{effectiveDate}</Text>
            </Section>

            <Section style={dateRow}>
              <Text style={dateLabel}>{t.deadlineLabel}</Text>
              <Text style={dateValueHighlight}>{disagreementDeadline}</Text>
            </Section>

            <Text style={deadlineNote}>{t.deadlineExplanation}</Text>

            {/* Summary of changes if provided */}
            {summaryOfChanges && (
              <>
                <Hr style={hr} />
                <Text style={summaryLabel}>Summary / Podsumowanie:</Text>
                <Text style={summaryText}>{summaryOfChanges}</Text>
              </>
            )}
          </Section>

          {/* PDF attachment note */}
          <Section style={attachmentNote}>
            <Text style={attachmentText}>📎 {t.pdfAttached}</Text>
          </Section>

          {/* Disagree button */}
          <Section style={buttonContainer}>
            <Button style={disagreeButton} href={disagreeUrl}>
              {t.disagreeButton}
            </Button>
          </Section>

          {/* Warning about continued use */}
          <Section style={warningBox}>
            <Text style={warningText}>
              {interpolate(t.continueUsing, values)}
            </Text>
          </Section>

          <Hr style={footerHr} />

          <Text style={footer}>{t.footer}</Text>
          <Text style={footerDisclaimer}>{t.footerDisclaimer}</Text>
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

const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logoText = {
  color: '#f49f1e',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
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
  backgroundColor: '#fffbeb',
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

const dateRow = {
  margin: '8px 0',
}

const dateLabel = {
  color: '#78350f',
  fontSize: '12px',
  fontWeight: '600',
  lineHeight: '16px',
  margin: '0 0 2px',
  textTransform: 'uppercase' as const,
}

const dateValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '24px',
  margin: '0',
}

const dateValueHighlight = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0',
}

const deadlineNote = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '12px 0 0',
  fontStyle: 'italic' as const,
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

const attachmentNote = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '16px 0',
}

const attachmentText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const disagreeButton = {
  backgroundColor: '#dc2626',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const warningBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
}

const footerHr = {
  borderColor: '#e5e7eb',
  margin: '24px 0 16px',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const footerDisclaimer = {
  color: '#9ca3af',
  fontSize: '11px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0',
}

export default SilentAcceptanceEmail
