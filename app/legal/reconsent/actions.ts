'use server'

import { headers, cookies } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface OutdatedConsent {
  documentId: string
  documentType: string
  documentTitle: string
  currentVersion: number
  acceptedVersion: number | null
  summary: string | null
  content: string
  effectiveDate: string
  isChurchDocument: boolean // true for DPA and church_admin_terms
}

export async function getOutdatedConsents(): Promise<{
  consents?: OutdatedConsent[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  // Get user's profile to check if they're a church owner
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, church_id')
    .eq('user_id', user.id)
    .single()

  const isChurchOwner = profile?.role === 'owner'

  // Get user's locale from cookie or default to 'en'
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'

  // Determine which document types to fetch
  // All users need ToS and Privacy Policy
  // Church owners also need DPA and Church Admin Terms
  const documentTypes = ['terms_of_service', 'privacy_policy']
  if (isChurchOwner) {
    documentTypes.push('dpa', 'church_admin_terms')
  }

  // Get current versions of relevant documents
  // First try user's preferred locale, then fall back to any language
  // Include acceptance_type to handle silent vs active acceptance
  let { data: currentDocs } = await adminClient
    .from('legal_documents')
    .select('id, document_type, version, acceptance_type, title, summary, content, effective_date, language')
    .eq('is_current', true)
    .eq('language', locale)
    .in('document_type', documentTypes)

  // If no documents found for user's locale, try fetching all languages
  // and prefer English as fallback
  if (!currentDocs || currentDocs.length === 0) {
    const { data: fallbackDocs } = await adminClient
      .from('legal_documents')
      .select('id, document_type, version, acceptance_type, title, summary, content, effective_date, language')
      .eq('is_current', true)
      .in('document_type', documentTypes)

    currentDocs = fallbackDocs
  }

  if (!currentDocs || currentDocs.length === 0) {
    return { consents: [] }
  }

  // Deduplicate by document_type
  // Prefer user's locale, then 'en', then any available
  const uniqueDocs = Array.from(
    currentDocs.reduce((map, doc) => {
      const existing = map.get(doc.document_type)
      if (!existing) {
        map.set(doc.document_type, doc)
      } else {
        // Prefer user's locale
        if (doc.language === locale && existing.language !== locale) {
          map.set(doc.document_type, doc)
        }
        // Then prefer English
        else if (doc.language === 'en' && existing.language !== locale && existing.language !== 'en') {
          map.set(doc.document_type, doc)
        }
        // If same language preference, prefer higher version
        else if (doc.language === existing.language && doc.version > existing.version) {
          map.set(doc.document_type, doc)
        }
      }
      return map
    }, new Map<string, typeof currentDocs[0]>()).values()
  )

  // Get user's accepted versions for these document types
  // We need to find the most recent granted consent for each type
  const outdatedConsents: OutdatedConsent[] = []

  for (const doc of uniqueDocs) {
    const { data: userConsent } = await adminClient
      .from('consent_records')
      .select('document_version')
      .eq('user_id', user.id)
      .eq('consent_type', doc.document_type)
      .eq('action', 'granted')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    // If no consent record at all, needs consent
    if (!userConsent) {
      if (doc.acceptance_type === 'silent') {
        await adminClient.from('consent_records').insert({
          user_id: user.id,
          consent_type: doc.document_type,
          document_id: doc.id,
          document_version: doc.version,
          action: 'granted',
          context: { source: 'silent_acceptance', auto_accepted: true },
        })
        continue
      }

      const isChurchDoc = doc.document_type === 'dpa' || doc.document_type === 'church_admin_terms'
      outdatedConsents.push({
        documentId: doc.id,
        documentType: doc.document_type,
        documentTitle: doc.title,
        currentVersion: doc.version,
        acceptedVersion: null,
        summary: doc.summary,
        content: doc.content,
        effectiveDate: doc.effective_date,
        isChurchDocument: isChurchDoc,
      })
      continue
    }

    // If consent record has no document_version (legacy from signup before version tracking),
    // assume they accepted version 1. This is valid for v1, but needs reconsent for v2+.
    const acceptedVersion = userConsent.document_version ?? 1

    // Check if version is outdated
    if (acceptedVersion < doc.version) {
      // Handle silent acceptance - auto-record consent without user interaction
      if (doc.acceptance_type === 'silent') {
        await adminClient.from('consent_records').insert({
          user_id: user.id,
          consent_type: doc.document_type,
          document_id: doc.id,
          document_version: doc.version,
          action: 'granted',
          context: { source: 'silent_acceptance', auto_accepted: true },
        })
        continue
      }

      // Active acceptance - user must explicitly accept
      const isChurchDoc = doc.document_type === 'dpa' || doc.document_type === 'church_admin_terms'
      outdatedConsents.push({
        documentId: doc.id,
        documentType: doc.document_type,
        documentTitle: doc.title,
        currentVersion: doc.version,
        acceptedVersion,
        summary: doc.summary,
        content: doc.content,
        effectiveDate: doc.effective_date,
        isChurchDocument: isChurchDoc,
      })
    }
  }

  return { consents: outdatedConsents }
}

export async function recordSingleConsent(
  documentId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()
  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    null
  const userAgent = headersList.get('user-agent') || null

  // Get the document
  const { data: doc } = await adminClient
    .from('legal_documents')
    .select('id, document_type, version')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return { error: 'Document not found' }
  }

  // Create consent record
  const { error } = await adminClient.from('consent_records').insert({
    user_id: user.id,
    consent_type: doc.document_type,
    document_id: doc.id,
    document_version: doc.version,
    action: 'granted',
    ip_address: ipAddress,
    user_agent: userAgent,
    context: { source: 'active_acceptance_flow' },
  })

  if (error) {
    console.error('Error recording consent:', error)
    return { error: 'Failed to record consent' }
  }

  return { success: true }
}

export async function recordReconsentAction(
  documentTypes: string[]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()
  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    null
  const userAgent = headersList.get('user-agent') || null

  // Get current documents for the specified types
  const { data: docs } = await adminClient
    .from('legal_documents')
    .select('id, document_type, version')
    .eq('is_current', true)
    .in('document_type', documentTypes)

  if (!docs || docs.length === 0) {
    return { error: 'Documents not found' }
  }

  // Create consent records for each document
  const consents = docs.map((doc) => ({
    user_id: user.id,
    consent_type: doc.document_type,
    document_id: doc.id,
    document_version: doc.version,
    action: 'granted',
    ip_address: ipAddress,
    user_agent: userAgent,
    context: { source: 'reconsent_flow' },
  }))

  const { error } = await adminClient.from('consent_records').insert(consents)

  if (error) {
    console.error('Error recording re-consent:', error)
    return { error: 'Failed to record consent' }
  }

  return { success: true }
}

export async function checkNeedsReconsent(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const adminClient = createServiceRoleClient()

  // Use the database function we created
  const { data, error } = await adminClient.rpc('check_user_needs_reconsent', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error checking reconsent:', error)
    return false
  }

  return data === true
}
