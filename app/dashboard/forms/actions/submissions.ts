'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '@/lib/utils/server-auth'
import { internalFormSubmissionSchema } from '@/lib/validations/forms'

const PAGE_SIZE = 50

export async function getFormSubmissions(
  formId: string,
  options?: { cursor?: string; limit?: number }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission - only leaders+ can view submissions
  const permError = requireManagePermission(profile.role, 'view form responses')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  const limit = options?.limit || PAGE_SIZE

  let query = adminClient
    .from('form_submissions')
    .select(`
      *,
      respondent:profiles!respondent_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })
    .limit(limit + 1) // Fetch one extra to check for next page

  if (options?.cursor) {
    query = query.lt('submitted_at', options.cursor)
  }

  const { data: submissions, error } = await query

  if (error) {
    console.error('Error fetching submissions:', error)
    return { error: 'Failed to load submissions' }
  }

  const hasMore = submissions && submissions.length > limit
  const items = hasMore ? submissions.slice(0, -1) : submissions

  return {
    data: {
      submissions: items || [],
      nextCursor: hasMore && items?.length ? items[items.length - 1].submitted_at : null,
      hasMore,
    },
  }
}

export async function getSubmission(submissionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'view form responses')
  if (permError) return { error: permError }

  const { data: submission, error } = await adminClient
    .from('form_submissions')
    .select(`
      *,
      respondent:profiles!respondent_id (
        id,
        first_name,
        last_name,
        email
      ),
      form:forms!inner (
        id,
        title,
        church_id
      )
    `)
    .eq('id', submissionId)
    .single()

  if (error || !submission) {
    return { error: 'Submission not found' }
  }

  // Verify form belongs to church
  if ((submission.form as { church_id: string }).church_id !== profile.church_id) {
    return { error: 'Submission not found' }
  }

  return { data: submission }
}

export async function deleteSubmission(submissionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'manage form responses')
  if (permError) return { error: permError }

  // Get submission
  const { data: submission } = await adminClient
    .from('form_submissions')
    .select('form_id')
    .eq('id', submissionId)
    .single()

  if (!submission) {
    return { error: 'Submission not found' }
  }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', submission.form_id)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Submission not found' }
  }

  const formId = submission.form_id

  const { error } = await adminClient
    .from('form_submissions')
    .delete()
    .eq('id', submissionId)

  if (error) {
    console.error('Error deleting submission:', error)
    return { error: 'Failed to delete submission' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}

export async function submitInternalForm(data: { formId: string; responses: Record<string, unknown> }) {
  const validated = internalFormSubmissionSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid submission data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify form is published and internal
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id, status, access_type')
    .eq('id', validated.data.formId)
    .single()

  if (!form) {
    return { error: 'Form not found' }
  }

  if (form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  if (form.status !== 'published') {
    return { error: 'This form is not accepting responses' }
  }

  if (form.access_type !== 'internal') {
    return { error: 'This form requires public access' }
  }

  // Create submission
  const { data: submission, error } = await adminClient
    .from('form_submissions')
    .insert({
      form_id: validated.data.formId,
      respondent_id: profile.id,
      responses: validated.data.responses,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating submission:', error)
    return { error: 'Failed to submit form' }
  }

  return { data: submission }
}

export async function getSubmissionStats(formId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'view form responses')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  // Get total count
  const { count: totalCount } = await adminClient
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId)

  // Get submissions from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: recentCount } = await adminClient
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId)
    .gte('submitted_at', sevenDaysAgo.toISOString())

  // Get submissions from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayCount } = await adminClient
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId)
    .gte('submitted_at', today.toISOString())

  return {
    data: {
      total: totalCount || 0,
      last7Days: recentCount || 0,
      today: todayCount || 0,
    },
  }
}
