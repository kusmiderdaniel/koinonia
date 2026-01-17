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

export interface UserWithChurch {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  role: string
  active: boolean
  is_super_admin: boolean | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
  church: {
    id: string
    name: string
    subdomain: string
  } | null
  legalConsents: ConsentStatus[]
}

export async function getUsers(): Promise<{
  data?: UserWithChurch[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Fetch all auth users (includes users without profiles)
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()

  if (authError) {
    console.error('Error fetching auth users:', authError)
    return { error: 'Failed to fetch users' }
  }

  const authUsers = authData?.users || []

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      role,
      active,
      is_super_admin,
      created_at,
      updated_at,
      last_seen_at,
      church:churches (
        id,
        name,
        subdomain
      )
    `)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return { error: 'Failed to fetch users' }
  }

  // Create a map of profiles by user_id for quick lookup
  const profilesByUserId = new Map<string, typeof profiles[0]>()
  profiles?.forEach((profile) => {
    if (profile.user_id) {
      profilesByUserId.set(profile.user_id, profile)
    }
  })

  // Fetch current legal documents
  const { data: currentDocs } = await adminClient
    .from('legal_documents')
    .select('document_type, version')
    .eq('is_current', true)
    .eq('status', 'published')

  const currentVersions = new Map<string, number>()
  currentDocs?.forEach((doc) => {
    currentVersions.set(doc.document_type, doc.version)
  })

  // Get all auth user IDs for consent lookup
  const userIds = authUsers.map((u) => u.id)

  // Fetch consent records for all users
  const { data: consentRecords } = userIds.length > 0
    ? await adminClient
        .from('consent_records')
        .select('user_id, consent_type, document_version, recorded_at, action')
        .in('user_id', userIds)
        .order('recorded_at', { ascending: false })
    : { data: [] }

  // Group consent records by user
  const consentsByUser = new Map<string, Map<string, { version: number; recordedAt: string; action: string }>>()
  consentRecords?.forEach((record) => {
    if (!consentsByUser.has(record.user_id)) {
      consentsByUser.set(record.user_id, new Map())
    }
    const userConsents = consentsByUser.get(record.user_id)!
    // Only keep the most recent record for each consent type
    if (!userConsents.has(record.consent_type)) {
      userConsents.set(record.consent_type, {
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

  // Helper to build legal consents
  const buildLegalConsents = (userId: string): ConsentStatus[] => {
    const userConsents = consentsByUser.get(userId)
    const legalConsents: ConsentStatus[] = []

    // Check privacy_policy consent
    const privacyConsent = userConsents?.get('privacy_policy')
    const currentPrivacyVersion = currentVersions.get('privacy_policy') || 1
    const hasPrivacyConsent = isConsentGranted(privacyConsent?.action)
    legalConsents.push({
      documentType: 'privacy_policy',
      hasConsent: hasPrivacyConsent && privacyConsent?.version === currentPrivacyVersion,
      consentedVersion: hasPrivacyConsent ? privacyConsent?.version || null : null,
      currentVersion: currentPrivacyVersion,
      consentedAt: hasPrivacyConsent ? privacyConsent?.recordedAt || null : null,
    })

    // Check terms_of_service consent
    const termsConsent = userConsents?.get('terms_of_service')
    const currentTermsVersion = currentVersions.get('terms_of_service') || 1
    const hasTermsConsent = isConsentGranted(termsConsent?.action)
    legalConsents.push({
      documentType: 'terms_of_service',
      hasConsent: hasTermsConsent && termsConsent?.version === currentTermsVersion,
      consentedVersion: hasTermsConsent ? termsConsent?.version || null : null,
      currentVersion: currentTermsVersion,
      consentedAt: hasTermsConsent ? termsConsent?.recordedAt || null : null,
    })

    return legalConsents
  }

  // Combine auth users with their profiles (if any)
  const transformedUsers: UserWithChurch[] = authUsers.map((authUser) => {
    const profile = profilesByUserId.get(authUser.id)

    if (profile) {
      // User has a profile
      return {
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        role: profile.role,
        active: profile.active,
        is_super_admin: profile.is_super_admin,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_seen_at: profile.last_seen_at,
        church: Array.isArray(profile.church) ? profile.church[0] || null : profile.church,
        legalConsents: buildLegalConsents(authUser.id),
      }
    } else {
      // User without profile (not yet onboarded)
      const displayName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || ''
      const nameParts = displayName.split(' ')
      const firstName = nameParts[0] || authUser.email?.split('@')[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || ''

      return {
        id: authUser.id, // Use auth user ID as profile ID for users without profile
        user_id: authUser.id,
        first_name: firstName,
        last_name: lastName,
        email: authUser.email || null,
        role: 'pending', // Special role for users without profile
        active: true,
        is_super_admin: null,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
        last_seen_at: authUser.last_sign_in_at || null,
        church: null,
        legalConsents: buildLegalConsents(authUser.id),
      }
    }
  })

  // Sort by created_at descending
  transformedUsers.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return { data: transformedUsers }
}

export async function getUserDetails(userId: string): Promise<{
  data?: {
    user: UserWithChurch & {
      phone: string | null
      date_of_birth: string | null
      bio: string | null
      avatar_url: string | null
      language: string | null
    }
    stats: {
      eventsAttended: number
      ministriesJoined: number
      formsSubmitted: number
    }
    ministries: {
      id: string
      name: string
      role: string
    }[]
  }
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get user details
  const { data: user, error: userError } = await adminClient
    .from('profiles')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      active,
      is_super_admin,
      date_of_birth,
      bio,
      avatar_url,
      language,
      created_at,
      updated_at,
      last_seen_at,
      church:churches (
        id,
        name,
        subdomain
      )
    `)
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { error: 'User not found' }
  }

  // Get events attended count
  const { count: eventsAttended } = await adminClient
    .from('event_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // Get ministries
  const { data: ministryMembers } = await adminClient
    .from('ministry_members')
    .select(`
      ministry_id,
      role,
      ministry:ministries (
        id,
        name
      )
    `)
    .eq('profile_id', userId)

  const ministries = ministryMembers?.map((mm) => {
    // Supabase returns relations as arrays, extract the first item
    const ministry = Array.isArray(mm.ministry) ? mm.ministry[0] : mm.ministry
    return {
      id: ministry?.id || '',
      name: ministry?.name || '',
      role: mm.role,
    }
  }) || []

  // Get forms submitted count
  const { count: formsSubmitted } = await adminClient
    .from('form_responses')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // Get legal consent status
  const legalConsents: ConsentStatus[] = []

  if (user.user_id) {
    // Fetch current legal documents
    const { data: currentDocs } = await adminClient
      .from('legal_documents')
      .select('document_type, version')
      .eq('is_current', true)
      .eq('status', 'published')

    const currentVersions = new Map<string, number>()
    currentDocs?.forEach((doc) => {
      currentVersions.set(doc.document_type, doc.version)
    })

    // Fetch consent records for this user
    const { data: consentRecords } = await adminClient
      .from('consent_records')
      .select('consent_type, document_version, recorded_at, action')
      .eq('user_id', user.user_id)
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

    // Build consent status for privacy policy
    const privacyConsent = consentsByType.get('privacy_policy')
    const currentPrivacyVersion = currentVersions.get('privacy_policy') || 1
    const hasPrivacyConsent = isConsentGranted(privacyConsent?.action)
    legalConsents.push({
      documentType: 'privacy_policy',
      hasConsent: hasPrivacyConsent && privacyConsent?.version === currentPrivacyVersion,
      consentedVersion: hasPrivacyConsent ? privacyConsent?.version || null : null,
      currentVersion: currentPrivacyVersion,
      consentedAt: hasPrivacyConsent ? privacyConsent?.recordedAt || null : null,
    })

    // Build consent status for terms of service
    const termsConsent = consentsByType.get('terms_of_service')
    const currentTermsVersion = currentVersions.get('terms_of_service') || 1
    const hasTermsConsent = isConsentGranted(termsConsent?.action)
    legalConsents.push({
      documentType: 'terms_of_service',
      hasConsent: hasTermsConsent && termsConsent?.version === currentTermsVersion,
      consentedVersion: hasTermsConsent ? termsConsent?.version || null : null,
      currentVersion: currentTermsVersion,
      consentedAt: hasTermsConsent ? termsConsent?.recordedAt || null : null,
    })
  }

  // Transform user data to match expected interface
  const transformedUser = {
    ...user,
    church: Array.isArray(user.church) ? user.church[0] || null : user.church,
    legalConsents,
  }

  return {
    data: {
      user: transformedUser,
      stats: {
        eventsAttended: eventsAttended || 0,
        ministriesJoined: ministries.length,
        formsSubmitted: formsSubmitted || 0,
      },
      ministries,
    },
  }
}

export async function toggleSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<{
  success?: boolean
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  const { error } = await adminClient
    .from('profiles')
    .update({ is_super_admin: isSuperAdmin })
    .eq('id', userId)

  if (error) {
    console.error('Error updating super admin status:', error)
    return { error: 'Failed to update super admin status' }
  }

  return { success: true }
}

export interface GrowthDataPoint {
  month: string
  count: number
  cumulative: number
}

export async function getUsersGrowthData(): Promise<{
  data?: GrowthDataPoint[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all auth users (includes users without profiles)
  const { data: authData, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    console.error('Error fetching users growth data:', error)
    return { error: 'Failed to fetch growth data' }
  }

  const users = authData?.users || []

  if (users.length === 0) {
    return { data: [] }
  }

  // Sort by created_at
  users.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Generate last 12 months
  const months: GrowthDataPoint[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(now, i))
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'MMM yyyy')

    // Count users created in this month
    const count = users.filter((u) => {
      const createdMonth = format(new Date(u.created_at), 'yyyy-MM')
      return createdMonth === monthKey
    }).length

    // Calculate cumulative (total up to and including this month)
    const endOfMonth = new Date(monthDate)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    const cumulative = users.filter(
      (u) => new Date(u.created_at) < endOfMonth
    ).length

    months.push({
      month: monthLabel,
      count,
      cumulative,
    })
  }

  return { data: months }
}
