import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface ChurchDeletionWarningEmailTranslations {
  subject: string
  preview: string
  heading: string
  greeting: string
  intro: string
  deletionDateLabel: string
  reason: string
  yourAccountTitle: string
  accountSafe: string
  willBeDisconnected: string
  whatYouCanDo: string
  nextSteps: string[]
  questions: string
  footer: string
}

export const defaultTranslations: ChurchDeletionWarningEmailTranslations = {
  subject: 'Important: {churchName} will be deleted on {deletionDate}',
  preview: 'Your church {churchName} is scheduled for deletion - your account is safe',
  heading: 'Church Deletion Notice',
  greeting: 'Hi {name},',
  intro: "We're writing to inform you that <strong>{churchName}</strong> is scheduled for deletion due to the church owner's disagreement with updated legal documents.",
  deletionDateLabel: 'Scheduled Deletion Date',
  reason: 'The church owner has expressed disagreement with recent changes to our legal documents. As a result, the church and all its data will be permanently deleted.',
  yourAccountTitle: 'Your Personal Account',
  accountSafe: 'Your personal Koinonia account will NOT be deleted.',
  willBeDisconnected: 'You will be disconnected from {churchName} when the church is deleted.',
  whatYouCanDo: 'What You Can Do',
  nextSteps: [
    'Join another church using an invitation link or join code',
    'Create a new church if you want to continue using Koinonia',
    'Contact your church administrator if you have questions about this decision',
  ],
  questions: 'If you have any questions, please contact the church owner or administrators before the deletion date.',
  footer: 'This is an important notification from Koinonia.',
}

export const polishTranslations: ChurchDeletionWarningEmailTranslations = {
  subject: 'Ważne: {churchName} zostanie usunięty {deletionDate}',
  preview: 'Twój kościół {churchName} jest zaplanowany do usunięcia - Twoje konto jest bezpieczne',
  heading: 'Powiadomienie o usunięciu kościoła',
  greeting: 'Cześć {name},',
  intro: 'Informujemy, że <strong>{churchName}</strong> jest zaplanowany do usunięcia z powodu sprzeciwu właściciela kościoła wobec zaktualizowanych dokumentów prawnych.',
  deletionDateLabel: 'Planowana data usunięcia',
  reason: 'Właściciel kościoła wyraził sprzeciw wobec ostatnich zmian w naszych dokumentach prawnych. W związku z tym kościół i wszystkie jego dane zostaną trwale usunięte.',
  yourAccountTitle: 'Twoje konto osobiste',
  accountSafe: 'Twoje osobiste konto Koinonia NIE zostanie usunięte.',
  willBeDisconnected: 'Zostaniesz odłączony od {churchName} gdy kościół zostanie usunięty.',
  whatYouCanDo: 'Co możesz zrobić',
  nextSteps: [
    'Dołącz do innego kościoła używając linku zaproszenia lub kodu dołączenia',
    'Utwórz nowy kościół, jeśli chcesz kontynuować korzystanie z Koinonia',
    'Skontaktuj się z administratorem kościoła, jeśli masz pytania dotyczące tej decyzji',
  ],
  questions: 'Jeśli masz jakiekolwiek pytania, skontaktuj się z właścicielem kościoła lub administratorami przed datą usunięcia.',
  footer: 'Jest to ważne powiadomienie od Koinonia.',
}

export interface ChurchDeletionWarningEmailProps {
  recipientName: string
  churchName: string
  deletionDate: string
  translations?: ChurchDeletionWarningEmailTranslations
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`)
}

export function ChurchDeletionWarningEmail({
  recipientName,
  churchName,
  deletionDate,
  translations = defaultTranslations,
}: ChurchDeletionWarningEmailProps) {
  const t = translations
  const values = {
    name: recipientName,
    churchName,
    deletionDate,
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

          {/* Deletion date box */}
          <Section style={alertBox}>
            <Text style={alertLabel}>{t.deletionDateLabel}</Text>
            <Text style={alertDate}>{deletionDate}</Text>
          </Section>

          <Text style={reasonText}>{t.reason}</Text>

          <Hr style={hr} />

          {/* Your account section - reassurance */}
          <Section style={safeSection}>
            <Text style={safeTitleText}>{t.yourAccountTitle}</Text>
            <Text style={safeHighlight}>✓ {t.accountSafe}</Text>
            <Text style={disconnectNote}>
              {interpolate(t.willBeDisconnected, values)}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* What you can do section */}
          <Text style={sectionTitle}>{t.whatYouCanDo}</Text>
          <Section style={nextStepsSection}>
            {t.nextSteps.map((step, index) => (
              <Text key={index} style={stepItem}>
                • {step}
              </Text>
            ))}
          </Section>

          <Text style={questionsText}>{t.questions}</Text>

          <Hr style={footerHr} />

          <Text style={footer}>{t.footer}</Text>
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

const alertBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  border: '2px solid #fecaca',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const alertLabel = {
  color: '#991b1b',
  fontSize: '12px',
  fontWeight: '600',
  lineHeight: '16px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const alertDate = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '0',
}

const reasonText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const safeSection = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  border: '1px solid #a7f3d0',
  padding: '20px',
  margin: '0 0 16px',
}

const safeTitleText = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
}

const safeHighlight = {
  color: '#047857',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 8px',
}

const disconnectNote = {
  color: '#065f46',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const sectionTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const nextStepsSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '0 0 16px',
}

const stepItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const questionsText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic' as const,
}

const footerHr = {
  borderColor: '#e5e7eb',
  margin: '24px 0 16px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0',
}

export default ChurchDeletionWarningEmail
