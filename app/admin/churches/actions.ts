'use server'

import { subMonths, startOfMonth, format } from 'date-fns'
import { requireSuperAdmin, isAdminAuthError } from '@/lib/utils/admin-auth'

export interface ConsentStatus {
  documentType: string
  hasConsent: boolean
  consentedVersion: number | null
  currentVersion: number
  consentedAt: string | null
}

export interface ChurchWithStats {
  id: string
  name: string
  subdomain: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  website: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  member_count: number
  owner: {
    id: string
    user_id: string | null
    first_name: string
    last_name: string
    email: string | null
  } | null
  ownerConsents: ConsentStatus[]
}

export async function getChurches(): Promise<{
  data?: ChurchWithStats[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all churches
  const { data: churches, error: churchesError } = await adminClient
    .from('churches')
    .select('id, name, subdomain, email, phone, city, country, website, logo_url, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (churchesError) {
    console.error('Error fetching churches:', churchesError)
    return { error: 'Failed to fetch churches' }
  }

  if (!churches) {
    return { data: [] }
  }

  // Fetch current legal documents for church-oriented documents
  const { data: currentDocs } = await adminClient
    .from('legal_documents')
    .select('document_type, version')
    .eq('is_current', true)
    .eq('status', 'published')
    .in('document_type', ['dpa', 'church_admin_terms'])

  const currentVersions = new Map<string, number>()
  currentDocs?.forEach((doc) => {
    currentVersions.set(doc.document_type, doc.version)
  })

  // Get member counts and owners for each church
  const churchesWithStats: ChurchWithStats[] = await Promise.all(
    churches.map(async (church) => {
      // Get member count
      const { count: memberCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .eq('active', true)

      // Get owner (including user_id for consent lookup)
      const { data: owner } = await adminClient
        .from('profiles')
        .select('id, user_id, first_name, last_name, email')
        .eq('church_id', church.id)
        .eq('role', 'owner')
        .limit(1)
        .single()

      // Build owner consents
      let ownerConsents: ConsentStatus[] = []

      if (owner?.user_id) {
        // Fetch consent records for this owner
        const { data: consentRecords } = await adminClient
          .from('consent_records')
          .select('consent_type, document_version, recorded_at, action')
          .eq('user_id', owner.user_id)
          .in('consent_type', ['dpa', 'church_admin_terms'])
          .order('recorded_at', { ascending: false })

        // Group by consent type (keep most recent)
        const consentsByType = new Map<string, { version: number; recordedAt: string; action: string }>()
        consentRecords?.forEach((record) => {
          if (!consentsByType.has(record.consent_type)) {
            consentsByType.set(record.consent_type, {
              version: record.document_version || 0,
              recordedAt: record.recorded_at,
              action: record.action,
            })
          }
        })

        // Helper to check if action represents consent granted
        const isConsentGranted = (action: string | undefined): boolean => {
          return action === 'accept' || action === 'granted'
        }

        // Build consent status for DPA
        const dpaConsent = consentsByType.get('dpa')
        const currentDpaVersion = currentVersions.get('dpa') || 1
        const hasDpaConsent = isConsentGranted(dpaConsent?.action)
        ownerConsents.push({
          documentType: 'dpa',
          hasConsent: hasDpaConsent && dpaConsent?.version === currentDpaVersion,
          consentedVersion: hasDpaConsent ? dpaConsent?.version || null : null,
          currentVersion: currentDpaVersion,
          consentedAt: hasDpaConsent ? dpaConsent?.recordedAt || null : null,
        })

        // Build consent status for Church Admin Terms
        const adminTermsConsent = consentsByType.get('church_admin_terms')
        const currentAdminTermsVersion = currentVersions.get('church_admin_terms') || 1
        const hasAdminTermsConsent = isConsentGranted(adminTermsConsent?.action)
        ownerConsents.push({
          documentType: 'church_admin_terms',
          hasConsent: hasAdminTermsConsent && adminTermsConsent?.version === currentAdminTermsVersion,
          consentedVersion: hasAdminTermsConsent ? adminTermsConsent?.version || null : null,
          currentVersion: currentAdminTermsVersion,
          consentedAt: hasAdminTermsConsent ? adminTermsConsent?.recordedAt || null : null,
        })
      } else {
        // No owner user_id, return empty consents
        ownerConsents = [
          {
            documentType: 'dpa',
            hasConsent: false,
            consentedVersion: null,
            currentVersion: currentVersions.get('dpa') || 1,
            consentedAt: null,
          },
          {
            documentType: 'church_admin_terms',
            hasConsent: false,
            consentedVersion: null,
            currentVersion: currentVersions.get('church_admin_terms') || 1,
            consentedAt: null,
          },
        ]
      }

      return {
        ...church,
        member_count: memberCount || 0,
        owner: owner || null,
        ownerConsents,
      }
    })
  )

  return { data: churchesWithStats }
}

export async function getChurchDetails(churchId: string): Promise<{
  data?: {
    church: ChurchWithStats
    members: {
      id: string
      first_name: string
      last_name: string
      email: string | null
      role: string
      created_at: string
    }[]
    stats: {
      totalEvents: number
      totalMinistries: number
      totalForms: number
    }
  }
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get church details
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name, subdomain, email, phone, city, country, website, logo_url, created_at, updated_at')
    .eq('id', churchId)
    .single()

  if (churchError || !church) {
    return { error: 'Church not found' }
  }

  // Fetch current legal documents for church-oriented documents
  const { data: currentDocs } = await adminClient
    .from('legal_documents')
    .select('document_type, version')
    .eq('is_current', true)
    .eq('status', 'published')
    .in('document_type', ['dpa', 'church_admin_terms'])

  const currentVersions = new Map<string, number>()
  currentDocs?.forEach((doc) => {
    currentVersions.set(doc.document_type, doc.version)
  })

  // Get members (including user_id for owner consent lookup)
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, user_id, first_name, last_name, email, role, created_at')
    .eq('church_id', churchId)
    .eq('active', true)
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })

  // Get member count
  const { count: memberCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .eq('active', true)

  // Get owner
  const ownerMember = members?.find((m) => m.role === 'owner') || null

  // Build owner consents
  let ownerConsents: ConsentStatus[] = []

  if (ownerMember?.user_id) {
    // Fetch consent records for this owner
    const { data: consentRecords } = await adminClient
      .from('consent_records')
      .select('consent_type, document_version, recorded_at, action')
      .eq('user_id', ownerMember.user_id)
      .in('consent_type', ['dpa', 'church_admin_terms'])
      .order('recorded_at', { ascending: false })

    // Group by consent type (keep most recent)
    const consentsByType = new Map<string, { version: number; recordedAt: string; action: string }>()
    consentRecords?.forEach((record) => {
      if (!consentsByType.has(record.consent_type)) {
        consentsByType.set(record.consent_type, {
          version: record.document_version || 0,
          recordedAt: record.recorded_at,
          action: record.action,
        })
      }
    })

    // Helper to check if action represents consent granted
    const isConsentGranted = (action: string | undefined): boolean => {
      return action === 'accept' || action === 'granted'
    }

    // Build consent status for DPA
    const dpaConsent = consentsByType.get('dpa')
    const currentDpaVersion = currentVersions.get('dpa') || 1
    const hasDpaConsent = isConsentGranted(dpaConsent?.action)
    ownerConsents.push({
      documentType: 'dpa',
      hasConsent: hasDpaConsent && dpaConsent?.version === currentDpaVersion,
      consentedVersion: hasDpaConsent ? dpaConsent?.version || null : null,
      currentVersion: currentDpaVersion,
      consentedAt: hasDpaConsent ? dpaConsent?.recordedAt || null : null,
    })

    // Build consent status for Church Admin Terms
    const adminTermsConsent = consentsByType.get('church_admin_terms')
    const currentAdminTermsVersion = currentVersions.get('church_admin_terms') || 1
    const hasAdminTermsConsent = isConsentGranted(adminTermsConsent?.action)
    ownerConsents.push({
      documentType: 'church_admin_terms',
      hasConsent: hasAdminTermsConsent && adminTermsConsent?.version === currentAdminTermsVersion,
      consentedVersion: hasAdminTermsConsent ? adminTermsConsent?.version || null : null,
      currentVersion: currentAdminTermsVersion,
      consentedAt: hasAdminTermsConsent ? adminTermsConsent?.recordedAt || null : null,
    })
  } else {
    // No owner user_id, return empty consents
    ownerConsents = [
      {
        documentType: 'dpa',
        hasConsent: false,
        consentedVersion: null,
        currentVersion: currentVersions.get('dpa') || 1,
        consentedAt: null,
      },
      {
        documentType: 'church_admin_terms',
        hasConsent: false,
        consentedVersion: null,
        currentVersion: currentVersions.get('church_admin_terms') || 1,
        consentedAt: null,
      },
    ]
  }

  // Get stats
  const { count: totalEvents } = await adminClient
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  const { count: totalMinistries } = await adminClient
    .from('ministries')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  const { count: totalForms } = await adminClient
    .from('forms')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  return {
    data: {
      church: {
        ...church,
        member_count: memberCount || 0,
        owner: ownerMember
          ? {
              id: ownerMember.id,
              user_id: ownerMember.user_id,
              first_name: ownerMember.first_name,
              last_name: ownerMember.last_name,
              email: ownerMember.email,
            }
          : null,
        ownerConsents,
      },
      members: (members || []).map(m => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        role: m.role,
        created_at: m.created_at,
      })),
      stats: {
        totalEvents: totalEvents || 0,
        totalMinistries: totalMinistries || 0,
        totalForms: totalForms || 0,
      },
    },
  }
}

export interface GrowthDataPoint {
  month: string
  count: number
  cumulative: number
}

export async function getChurchesGrowthData(): Promise<{
  data?: GrowthDataPoint[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all churches with their created_at dates
  const { data: churches, error } = await adminClient
    .from('churches')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching churches growth data:', error)
    return { error: 'Failed to fetch growth data' }
  }

  if (!churches || churches.length === 0) {
    return { data: [] }
  }

  // Generate last 12 months
  const months: GrowthDataPoint[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(now, i))
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'MMM yyyy')

    // Count churches created in this month
    const count = churches.filter((c) => {
      const createdMonth = format(new Date(c.created_at), 'yyyy-MM')
      return createdMonth === monthKey
    }).length

    // Calculate cumulative (total up to and including this month)
    const endOfMonth = new Date(monthDate)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    const cumulative = churches.filter(
      (c) => new Date(c.created_at) < endOfMonth
    ).length

    months.push({
      month: monthLabel,
      count,
      cumulative,
    })
  }

  return { data: months }
}
