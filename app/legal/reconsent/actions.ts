'use server'

import { headers, cookies } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface OutdatedConsent {
  documentType: string
  currentVersion: number
  acceptedVersion: number | null
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

  // Get user's locale from cookie or default to 'en'
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'

  // Get current versions of TOS and Privacy Policy for user's locale
  // Include acceptance_type to handle silent vs active acceptance
  const { data: currentDocs } = await adminClient
    .from('legal_documents')
    .select('id, document_type, version, acceptance_type')
    .eq('is_current', true)
    .eq('language', locale)
    .in('document_type', ['terms_of_service', 'privacy_policy'])

  if (!currentDocs || currentDocs.length === 0) {
    return { consents: [] }
  }

  // Deduplicate by document_type (take the first/highest version)
  const uniqueDocs = Array.from(
    currentDocs.reduce((map, doc) => {
      if (!map.has(doc.document_type) || map.get(doc.document_type)!.version < doc.version) {
        map.set(doc.document_type, doc)
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

      outdatedConsents.push({
        documentType: doc.document_type,
        currentVersion: doc.version,
        acceptedVersion: null,
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
      outdatedConsents.push({
        documentType: doc.document_type,
        currentVersion: doc.version,
        acceptedVersion,
      })
    }
  }

  return { consents: outdatedConsents }
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
