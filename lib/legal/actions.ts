'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

type ConsentType = 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms' | 'data_sharing'

interface RecordConsentParams {
  consentType: ConsentType
  churchId?: string
  dataCategoriesShared?: string[]
  context?: Record<string, unknown>
}

interface ConsentResult {
  success: boolean
  error?: string
}

/**
 * Records a consent action for the current user
 */
export async function recordConsent({
  consentType,
  churchId,
  dataCategoriesShared,
  context,
}: RecordConsentParams): Promise<ConsentResult> {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get request metadata
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      null
    const userAgent = headersList.get('user-agent') || null

    // Get current document for this consent type
    const { data: document, error: docError } = await supabase
      .from('legal_documents')
      .select('id, version')
      .eq('document_type', consentType === 'data_sharing' ? 'privacy_policy' : consentType)
      .eq('is_current', true)
      .single()

    if (docError && consentType !== 'data_sharing') {
      return { success: false, error: 'Failed to find legal document' }
    }

    // Record the consent
    const { error: insertError } = await supabase
      .from('consent_records')
      .insert({
        user_id: user.id,
        church_id: churchId || null,
        consent_type: consentType,
        document_id: document?.id || null,
        document_version: document?.version || null,
        action: 'granted',
        ip_address: ipAddress,
        user_agent: userAgent,
        context: context || null,
        data_categories_shared: dataCategoriesShared || null,
      })

    if (insertError) {
      console.error('Failed to record consent:', insertError)
      return { success: false, error: 'Failed to record consent' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error recording consent:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Records multiple consents at once (e.g., TOS + Privacy Policy at signup)
 */
export async function recordMultipleConsents(
  consents: RecordConsentParams[]
): Promise<ConsentResult> {
  for (const consent of consents) {
    const result = await recordConsent(consent)
    if (!result.success) {
      return result
    }
  }
  return { success: true }
}

/**
 * Checks if user needs to re-consent to any documents
 */
export async function checkNeedsReconsent(): Promise<{
  needsReconsent: boolean
  outdatedDocuments: string[]
}> {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { needsReconsent: false, outdatedDocuments: [] }
    }

    // Get current documents
    const { data: currentDocs } = await supabase
      .from('legal_documents')
      .select('document_type, id, version')
      .eq('is_current', true)
      .eq('language', 'en') // Use EN as reference for version checking
      .in('document_type', ['terms_of_service', 'privacy_policy'])

    if (!currentDocs || currentDocs.length === 0) {
      return { needsReconsent: false, outdatedDocuments: [] }
    }

    // Get user's latest consents
    const { data: consents } = await supabase
      .from('consent_records')
      .select('consent_type, document_id, document_version')
      .eq('user_id', user.id)
      .eq('action', 'granted')
      .in('consent_type', ['terms_of_service', 'privacy_policy'])
      .order('recorded_at', { ascending: false })

    const outdatedDocuments: string[] = []

    for (const doc of currentDocs) {
      const latestConsent = consents?.find(c => c.consent_type === doc.document_type)

      if (!latestConsent || latestConsent.document_version !== doc.version) {
        outdatedDocuments.push(doc.document_type)
      }
    }

    return {
      needsReconsent: outdatedDocuments.length > 0,
      outdatedDocuments,
    }
  } catch (error) {
    console.error('Error checking reconsent:', error)
    return { needsReconsent: false, outdatedDocuments: [] }
  }
}

/**
 * Gets user's consent history
 */
export async function getConsentHistory() {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', consents: [] }
    }

    const { data: consents, error } = await supabase
      .from('consent_records')
      .select(`
        id,
        consent_type,
        action,
        document_version,
        recorded_at,
        church_id,
        data_categories_shared,
        legal_documents (
          title,
          version
        )
      `)
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Failed to fetch consent history', consents: [] }
    }

    return { success: true, consents: consents || [] }
  } catch (error) {
    console.error('Error fetching consent history:', error)
    return { success: false, error: 'An unexpected error occurred', consents: [] }
  }
}
