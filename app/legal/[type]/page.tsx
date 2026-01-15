import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LegalDocumentPage } from './LegalDocumentPage'

// Force dynamic rendering - these pages depend on database content
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['terms-of-service', 'privacy-policy', 'dpa', 'church-admin-terms'] as const
type ValidType = (typeof VALID_TYPES)[number]

const TYPE_MAP: Record<ValidType, string> = {
  'terms-of-service': 'terms_of_service',
  'privacy-policy': 'privacy_policy',
  'dpa': 'dpa',
  'church-admin-terms': 'church_admin_terms',
}

const TYPE_TITLES: Record<string, Record<'en' | 'pl', string>> = {
  terms_of_service: { en: 'Terms of Service', pl: 'Regulamin' },
  privacy_policy: { en: 'Privacy Policy', pl: 'Polityka Prywatności' },
  dpa: { en: 'Data Processing Agreement', pl: 'Umowa Powierzenia Przetwarzania Danych' },
  church_admin_terms: { en: 'Church Administrator Terms', pl: 'Regulamin Administratora Kościoła' },
}

interface LegalPageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ lang?: string }>
}

export default async function LegalPage({ params, searchParams }: LegalPageProps) {
  const { type } = await params
  const { lang } = await searchParams

  // Validate type
  if (!VALID_TYPES.includes(type as ValidType)) {
    notFound()
  }

  const documentType = TYPE_MAP[type as ValidType]

  // Determine language - prefer query param, then try to get from user profile, default to 'en'
  let language: 'en' | 'pl' = 'en'

  if (lang === 'pl' || lang === 'en') {
    language = lang
  } else {
    // Try to get user's language preference
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('user_id', user.id)
        .single()

      if (profile?.language === 'pl' || profile?.language === 'en') {
        language = profile.language
      }
    }
  }

  // Fetch the document
  const supabase = await createClient()
  const { data: document, error } = await supabase
    .from('legal_documents')
    .select('id, title, content, version, effective_date, document_type, language')
    .eq('document_type', documentType)
    .eq('language', language)
    .eq('is_current', true)
    .eq('status', 'published')
    .single()

  if (error || !document) {
    // Try the other language if not found
    const otherLang = language === 'en' ? 'pl' : 'en'
    const { data: altDocument } = await supabase
      .from('legal_documents')
      .select('id, title, content, version, effective_date, document_type, language')
      .eq('document_type', documentType)
      .eq('language', otherLang)
      .eq('is_current', true)
      .eq('status', 'published')
      .single()

    if (!altDocument) {
      notFound()
    }

    return (
      <LegalDocumentPage
        document={altDocument}
        typeTitle={TYPE_TITLES[documentType]?.[otherLang as 'en' | 'pl'] || documentType}
      />
    )
  }

  return (
    <LegalDocumentPage
      document={document}
      typeTitle={TYPE_TITLES[documentType]?.[language] || documentType}
    />
  )
}
