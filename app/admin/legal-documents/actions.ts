'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { notifyUsersOfDocumentUpdate } from '@/lib/notifications/legal-document-update'
import { sendSilentAcceptanceNotifications } from '@/lib/notifications/silent-acceptance'

export type DocumentType = 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms'
export type Language = 'en' | 'pl'
export type DocumentStatus = 'draft' | 'published'
export type AcceptanceType = 'silent' | 'active'

export interface LegalDocument {
  id: string
  document_type: DocumentType
  version: number
  language: Language
  title: string
  content: string
  summary: string | null
  effective_date: string
  is_current: boolean
  status: DocumentStatus
  acceptance_type: AcceptanceType
  published_at: string | null
  created_at: string
  created_by: string | null
}

export interface LegalDocumentWithStats extends LegalDocument {
  accepted_count: number
  withdrawn_count: number
}

export interface GroupedDocuments {
  [documentType: string]: {
    [language: string]: LegalDocumentWithStats[]
  }
}

// Helper to check super admin access
async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', user: null, profile: null }
  }

  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, user_id, is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile || !isSuperAdmin(profile)) {
    return { error: 'Not authorized', user: null, profile: null }
  }

  return { error: null, user, profile }
}

/**
 * Get all legal documents grouped by type and language
 */
export async function getLegalDocuments(): Promise<{
  data?: GroupedDocuments
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { error: auth.error }

  const adminClient = createServiceRoleClient()

  // Get documents with stats from the view
  const { data: documents, error } = await adminClient
    .from('legal_document_stats')
    .select('*')
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching legal documents:', error)
    return { error: 'Failed to load documents' }
  }

  // Group by document_type and language
  const grouped: GroupedDocuments = {}

  for (const doc of documents || []) {
    if (!grouped[doc.document_type]) {
      grouped[doc.document_type] = {}
    }
    if (!grouped[doc.document_type][doc.language]) {
      grouped[doc.document_type][doc.language] = []
    }
    grouped[doc.document_type][doc.language].push(doc as LegalDocumentWithStats)
  }

  return { data: grouped }
}

/**
 * Get a single legal document by ID
 */
export async function getLegalDocument(id: string): Promise<{
  data?: LegalDocument
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { error: auth.error }

  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient
    .from('legal_documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching legal document:', error)
    return { error: 'Failed to load document' }
  }

  return { data: data as LegalDocument }
}

/**
 * Get the current published document for a type/language
 */
export async function getCurrentPublishedDocument(
  documentType: DocumentType,
  language: Language
): Promise<{
  data?: LegalDocument
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { error: auth.error }

  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient
    .from('legal_documents')
    .select('*')
    .eq('document_type', documentType)
    .eq('language', language)
    .eq('is_current', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'No published document found' }
    }
    console.error('Error fetching current document:', error)
    return { error: 'Failed to load document' }
  }

  return { data: data as LegalDocument }
}

/**
 * Create a new draft document
 */
export async function createDraftDocument(data: {
  document_type: DocumentType
  language: Language
  title: string
  content: string
  summary?: string
  effective_date: string
  acceptance_type: AcceptanceType
}): Promise<{
  data?: { id: string }
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { error: auth.error }

  const adminClient = createServiceRoleClient()

  // Get next version number
  const { data: versionData } = await adminClient
    .rpc('get_next_legal_document_version', {
      p_document_type: data.document_type,
      p_language: data.language,
    })

  const version = versionData || 1

  const { data: newDoc, error } = await adminClient
    .from('legal_documents')
    .insert({
      document_type: data.document_type,
      language: data.language,
      version,
      title: data.title,
      content: data.content,
      summary: data.summary || null,
      effective_date: data.effective_date,
      acceptance_type: data.acceptance_type,
      status: 'draft',
      is_current: false,
      created_by: auth.user!.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating draft document:', error)
    return { error: 'Failed to create document' }
  }

  revalidatePath('/admin/legal-documents')
  return { data: { id: newDoc.id } }
}

/**
 * Update a draft document
 */
export async function updateDraftDocument(
  id: string,
  data: {
    title?: string
    content?: string
    summary?: string
    effective_date?: string
    acceptance_type?: AcceptanceType
  }
): Promise<{
  success: boolean
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { success: false, error: auth.error }

  const adminClient = createServiceRoleClient()

  // Verify document is a draft
  const { data: existing } = await adminClient
    .from('legal_documents')
    .select('status')
    .eq('id', id)
    .single()

  if (!existing || existing.status !== 'draft') {
    return { success: false, error: 'Can only edit draft documents' }
  }

  const { error } = await adminClient
    .from('legal_documents')
    .update({
      title: data.title,
      content: data.content,
      summary: data.summary,
      effective_date: data.effective_date,
      acceptance_type: data.acceptance_type,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating draft document:', error)
    return { success: false, error: 'Failed to update document' }
  }

  revalidatePath('/admin/legal-documents')
  revalidatePath(`/admin/legal-documents/${id}`)
  return { success: true }
}

/**
 * Publish a document (make it current)
 */
export async function publishDocument(
  id: string,
  sendNotificationEmail: boolean = false
): Promise<{
  success: boolean
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { success: false, error: auth.error }

  const adminClient = createServiceRoleClient()

  // Get the document to publish
  const { data: doc } = await adminClient
    .from('legal_documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!doc) {
    return { success: false, error: 'Document not found' }
  }

  if (doc.status === 'published' && doc.is_current) {
    return { success: false, error: 'Document is already published and current' }
  }

  // Start a transaction-like operation
  // 1. Set previous current document(s) to not current
  const { error: unsetError } = await adminClient
    .from('legal_documents')
    .update({ is_current: false })
    .eq('document_type', doc.document_type)
    .eq('language', doc.language)
    .eq('is_current', true)

  if (unsetError) {
    console.error('Error unsetting current document:', unsetError)
    return { success: false, error: 'Failed to publish document' }
  }

  // 2. Update this document to be current and published
  const { error: publishError } = await adminClient
    .from('legal_documents')
    .update({
      status: 'published',
      is_current: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (publishError) {
    console.error('Error publishing document:', publishError)
    return { success: false, error: 'Failed to publish document' }
  }

  // 3. Send notifications based on acceptance type
  if (doc.acceptance_type === 'silent') {
    // Silent acceptance: Always send notification emails with PDF attachments
    // Users can disagree within the grace period (14 days for ToS/PP, 30 days for DPA/AT)
    sendSilentAcceptanceNotifications({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      documentType: doc.document_type,
      version: doc.version,
      effectiveDate: doc.effective_date,
      summary: doc.summary,
      language: doc.language as 'en' | 'pl',
    }).catch((err) => {
      console.error('Error sending silent acceptance notifications:', err)
    })
  } else if (sendNotificationEmail && doc.acceptance_type === 'active') {
    // Active acceptance: Optionally send notification emails
    notifyUsersOfDocumentUpdate({
      id: doc.id,
      title: doc.title,
      documentType: doc.document_type,
      summary: doc.summary,
    }).catch((err) => {
      console.error('Error sending document update notifications:', err)
    })
  }

  revalidatePath('/admin/legal-documents')
  return { success: true }
}

/**
 * Delete a draft document
 */
export async function deleteDraftDocument(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { success: false, error: auth.error }

  const adminClient = createServiceRoleClient()

  // Verify document is a draft
  const { data: existing } = await adminClient
    .from('legal_documents')
    .select('status')
    .eq('id', id)
    .single()

  if (!existing || existing.status !== 'draft') {
    return { success: false, error: 'Can only delete draft documents' }
  }

  const { error } = await adminClient
    .from('legal_documents')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting draft document:', error)
    return { success: false, error: 'Failed to delete document' }
  }

  revalidatePath('/admin/legal-documents')
  return { success: true }
}

/**
 * Get document acceptance statistics
 */
export async function getDocumentStatistics(documentId: string): Promise<{
  data?: {
    acceptedCount: number
    withdrawnCount: number
    totalUsers: number
  }
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { error: auth.error }

  const adminClient = createServiceRoleClient()

  // Get stats from the view
  const { data: stats } = await adminClient
    .from('legal_document_stats')
    .select('accepted_count, withdrawn_count')
    .eq('document_id', documentId)
    .single()

  // Get total user count
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return {
    data: {
      acceptedCount: stats?.accepted_count || 0,
      withdrawnCount: stats?.withdrawn_count || 0,
      totalUsers: totalUsers || 0,
    },
  }
}

/**
 * Get paginated acceptance records for a document
 */
export async function getAcceptanceRecords(
  documentId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{
  data?: Array<{
    id: string
    user_id: string
    action: string
    recorded_at: string
    user_email?: string
    user_name?: string
  }>
  total: number
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (auth.error) return { total: 0, error: auth.error }

  const adminClient = createServiceRoleClient()

  // Get consent records with user info
  const { data: records, count, error } = await adminClient
    .from('consent_records')
    .select(`
      id,
      user_id,
      action,
      recorded_at
    `, { count: 'exact' })
    .eq('document_id', documentId)
    .order('recorded_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    console.error('Error fetching acceptance records:', error)
    return { total: 0, error: 'Failed to load records' }
  }

  // Get user details for these records
  const userIds = [...new Set(records?.map(r => r.user_id) || [])]

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('user_id, first_name, last_name, email')
    .in('user_id', userIds)

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

  const enrichedRecords = records?.map(r => {
    const profile = profileMap.get(r.user_id)
    return {
      ...r,
      user_email: profile?.email,
      user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
    }
  })

  return {
    data: enrichedRecords || [],
    total: count || 0,
  }
}
