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
  whatHappens: string
  automaticAcceptance: string
  viewDocumentButton: string
  disagreeButton: string
  disagreeWarning: string
  pdfAttached: string
  footer: string
  footerDisclaimer: string
}

export const defaultTranslations: SilentAcceptanceEmailTranslations = {
  subject: 'Updated {documentTitle} - Changes effective {effectiveDate}',
  preview: 'Important changes to {documentTitle} effective {effectiveDate}',
  heading: 'Legal Document Updated',
  greeting: 'Hi {name},',
  intro: "We've updated our <strong>{documentTitle}</strong>. These changes will take effect on <strong>{effectiveDate}</strong>.",
  effectiveDateLabel: 'Changes take effect on',
  deadlineLabel: 'Deadline to disagree',
  deadlineExplanation: 'If you do not express disagreement by this date, you automatically accept the updated terms.',
  whatHappens: 'What happens next?',
  automaticAcceptance: "You don't need to do anything. If you continue using Koinonia after {effectiveDate}, the updated terms will apply to you automatically.",
  viewDocumentButton: 'View Updated Document',
  disagreeButton: 'I Disagree with These Changes',
  disagreeWarning: 'If you disagree, your account will be scheduled for deletion. You have until {effectiveDate} to express disagreement.',
  pdfAttached: 'The full document is attached to this email as a PDF.',
  footer: 'This is an important legal notification from Koinonia.',
  footerDisclaimer: 'You received this email because you are a user of Koinonia.',
}

export const polishTranslations: SilentAcceptanceEmailTranslations = {
  subject: 'Zaktualizowano {documentTitle} - Zmiany wchodzą w życie {effectiveDate}',
  preview: 'Ważne zmiany w {documentTitle} wchodzą w życie {effectiveDate}',
  heading: 'Dokument prawny zaktualizowany',
  greeting: 'Cześć {name},',
  intro: 'Zaktualizowaliśmy nasz dokument <strong>{documentTitle}</strong>. Zmiany wchodzą w życie <strong>{effectiveDate}</strong>.',
  effectiveDateLabel: 'Zmiany wchodzą w życie',
  deadlineLabel: 'Termin na wyrażenie sprzeciwu',
  deadlineExplanation: 'Jeśli nie wyrazisz sprzeciwu do tego terminu, automatycznie akceptujesz zaktualizowane warunki.',
  whatHappens: 'Co dalej?',
  automaticAcceptance: 'Nie musisz nic robić. Jeśli będziesz kontynuować korzystanie z Koinonia po {effectiveDate}, zaktualizowane warunki będą obowiązywać automatycznie.',
  viewDocumentButton: 'Zobacz zaktualizowany dokument',
  disagreeButton: 'Nie zgadzam się ze zmianami',
  disagreeWarning: 'Jeśli się nie zgadzasz, Twoje konto zostanie zaplanowane do usunięcia. Masz czas do {effectiveDate}, aby wyrazić sprzeciw.',
  pdfAttached: 'Pełny dokument jest załączony do tej wiadomości jako PDF.',
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
  viewUrl: string
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
  viewUrl,
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

          {/* View document button - Primary action */}
          <Section style={buttonContainer}>
            <Button style={viewButton} href={viewUrl}>
              {t.viewDocumentButton}
            </Button>
          </Section>

          {/* What happens next - Automatic acceptance explanation */}
          <Section style={infoBox}>
            <Text style={infoTitle}>{t.whatHappens}</Text>
            <Text style={infoText}>
              {interpolate(t.automaticAcceptance, values)}
            </Text>
          </Section>

          <Hr style={sectionHr} />

          {/* Disagree section */}
          <Section style={disagreeSection}>
            <Text style={disagreeWarningText}>
              {interpolate(t.disagreeWarning, values)}
            </Text>
            <Section style={buttonContainer}>
              <Button style={disagreeButtonStyle} href={disagreeUrl}>
                {t.disagreeButton}
              </Button>
            </Section>
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

const viewButton = {
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

const infoBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '6px',
  border: '1px solid #bbf7d0',
  padding: '16px',
  margin: '24px 0',
}

const infoTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const infoText = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const sectionHr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const disagreeSection = {
  margin: '24px 0',
}

const disagreeWarningText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const disagreeButtonStyle = {
  backgroundColor: '#dc2626',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
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
