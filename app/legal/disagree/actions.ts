'use server'

import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { addDays } from 'date-fns'
import { revalidatePath } from 'next/cache'

// Deadlines in days after effective date
const DEADLINE_DAYS = {
  terms_of_service: 14,
  privacy_policy: 14,
  dpa: 30,
  church_admin_terms: 30,
}

type DocumentType = 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms'

export interface DisagreementInfo {
  id: string
  documentType: DocumentType
  documentTitle: string
  documentVersion: number
  effectiveDate: string
  deadline: string
  isChurchDeletion: boolean
  churchName?: string
  churchId?: string
}

/**
 * Get information about a pending document that can be disagreed with
 */
export async function getDisagreementInfo(
  documentType: DocumentType,
  documentId?: string
): Promise<{ data?: DisagreementInfo; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  // Get the document
  let query = adminClient
    .from('legal_documents')
    .select('*')
    .eq('document_type', documentType)
    .eq('is_current', true)
    .eq('status', 'published')

  if (documentId) {
    query = adminClient
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
  }

  const { data: doc, error: docError } = await query.single()

  if (docError || !doc) {
    return { error: 'Document not found' }
  }

  // Check if user already has a pending disagreement for this document
  const { data: existingDisagreement } = await adminClient
    .from('legal_disagreements')
    .select('id')
    .eq('user_id', user.id)
    .eq('document_id', doc.id)
    .eq('status', 'pending')
    .single()

  if (existingDisagreement) {
    return { error: 'You already have a pending disagreement for this document' }
  }

  // Calculate deadline
  const effectiveDate = new Date(doc.effective_date)
  const deadlineDays = DEADLINE_DAYS[documentType as keyof typeof DEADLINE_DAYS] || 14
  const deadline = addDays(effectiveDate, deadlineDays)

  // Check if deadline has passed
  if (deadline < new Date()) {
    return { error: 'The disagreement deadline has passed' }
  }

  // For DPA/Admin Terms, get church info
  const isChurchDeletion = documentType === 'dpa' || documentType === 'church_admin_terms'
  let churchName: string | undefined
  let churchId: string | undefined

  if (isChurchDeletion) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('church_id, role, church:churches(id, name)')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return { error: 'Only church owners can disagree with DPA/Admin Terms' }
    }

    // church is an array from the join, get the first element
    const churchData = profile.church as Array<{ id: string; name: string }> | null
    const church = churchData?.[0]
    if (church) {
      churchName = church.name
      churchId = church.id
    }
  }

  return {
    data: {
      id: doc.id,
      documentType: doc.document_type as DocumentType,
      documentTitle: doc.title,
      documentVersion: doc.version,
      effectiveDate: doc.effective_date,
      deadline: deadline.toISOString(),
      isChurchDeletion,
      churchName,
      churchId,
    },
  }
}

/**
 * Verify password and record a disagreement
 */
export async function recordDisagreement(
  documentId: string,
  password: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (signInError) {
    return { success: false, error: 'Incorrect password' }
  }

  const adminClient = createServiceRoleClient()

  // Get the document
  const { data: doc, error: docError } = await adminClient
    .from('legal_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !doc) {
    return { success: false, error: 'Document not found' }
  }

  // Get user profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'Profile not found' }
  }

  // Determine disagreement type
  const isChurchDeletion = doc.document_type === 'dpa' || doc.document_type === 'church_admin_terms'

  // Validate church owner for church deletion
  if (isChurchDeletion && profile.role !== 'owner') {
    return { success: false, error: 'Only church owners can disagree with this document' }
  }

  // Calculate deadline
  const effectiveDate = new Date(doc.effective_date)
  const deadlineDays = DEADLINE_DAYS[doc.document_type as keyof typeof DEADLINE_DAYS] || 14
  const deadline = addDays(effectiveDate, deadlineDays)

  // Check if deadline has passed
  if (deadline < new Date()) {
    return { success: false, error: 'The disagreement deadline has passed' }
  }

  // Get request metadata
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || null
  const userAgent = headersList.get('user-agent') || null

  // Check for existing pending disagreement
  const { data: existingDisagreement } = await adminClient
    .from('legal_disagreements')
    .select('id')
    .eq('user_id', user.id)
    .eq('document_id', documentId)
    .eq('status', 'pending')
    .single()

  if (existingDisagreement) {
    return { success: false, error: 'You already have a pending disagreement for this document' }
  }

  // Create disagreement record
  const { data: disagreement, error: insertError } = await adminClient
    .from('legal_disagreements')
    .insert({
      user_id: user.id,
      profile_id: profile.id,
      church_id: isChurchDeletion ? profile.church_id : null,
      document_id: documentId,
      document_type: doc.document_type,
      document_version: doc.version,
      disagreement_type: isChurchDeletion ? 'church_deletion' : 'user_deletion',
      status: 'pending',
      deadline_at: deadline.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      verified_at: new Date().toISOString(),
      reason,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error recording disagreement:', insertError)
    return { success: false, error: 'Failed to record disagreement' }
  }

  // For church deletion, create a deletion schedule
  if (isChurchDeletion && profile.church_id) {
    const { error: scheduleError } = await adminClient
      .from('church_deletion_schedules')
      .insert({
        church_id: profile.church_id,
        disagreement_id: disagreement.id,
        scheduled_deletion_at: deadline.toISOString(),
        status: 'pending',
      })

    if (scheduleError) {
      console.error('Error creating church deletion schedule:', scheduleError)
      // Don't fail the whole operation, just log the error
    }
  }

  revalidatePath('/legal/disagree')
  return { success: true }
}

/**
 * Withdraw a disagreement (re-agree to the document)
 */
export async function withdrawDisagreement(
  disagreementId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  // Get the disagreement
  const { data: disagreement, error: fetchError } = await adminClient
    .from('legal_disagreements')
    .select('*')
    .eq('id', disagreementId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !disagreement) {
    return { success: false, error: 'Disagreement not found or already processed' }
  }

  // Update disagreement status to withdrawn
  const { error: updateError } = await adminClient
    .from('legal_disagreements')
    .update({ status: 'withdrawn' })
    .eq('id', disagreementId)

  if (updateError) {
    console.error('Error withdrawing disagreement:', updateError)
    return { success: false, error: 'Failed to withdraw disagreement' }
  }

  // If it's a church deletion, cancel the schedule
  if (disagreement.disagreement_type === 'church_deletion') {
    await adminClient
      .from('church_deletion_schedules')
      .update({ status: 'cancelled' })
      .eq('disagreement_id', disagreementId)
  }

  // Record consent for the document
  const { data: doc } = await adminClient
    .from('legal_documents')
    .select('id, document_type, version')
    .eq('id', disagreement.document_id)
    .single()

  if (doc) {
    await adminClient.from('consent_records').insert({
      user_id: user.id,
      consent_type: doc.document_type,
      document_id: doc.id,
      document_version: doc.version,
      action: 'granted',
      context: { source: 'disagreement_withdrawal' },
    })
  }

  revalidatePath('/legal/disagree')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Get user's pending disagreements
 */
export async function getPendingDisagreements(): Promise<{
  data?: Array<{
    id: string
    documentType: string
    documentTitle: string
    deadline: string
    isChurchDeletion: boolean
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  const { data: disagreements, error } = await adminClient
    .from('legal_disagreements')
    .select(`
      id,
      document_type,
      deadline_at,
      disagreement_type,
      document:legal_documents(title)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('deadline_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending disagreements:', error)
    return { error: 'Failed to load disagreements' }
  }

  return {
    data: disagreements?.map((d) => {
      // document is an array from the join, get the first element
      const docData = d.document as Array<{ title: string }> | null
      return {
        id: d.id,
        documentType: d.document_type,
        documentTitle: docData?.[0]?.title || d.document_type,
        deadline: d.deadline_at,
        isChurchDeletion: d.disagreement_type === 'church_deletion',
      }
    }),
  }
}
