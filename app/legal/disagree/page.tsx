import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDisagreementInfo } from './actions'

// Helper to check if error is a Next.js redirect
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

interface DisagreePageProps {
  searchParams: Promise<{
    doc?: string
    id?: string
  }>
}

/**
 * Entry point for legal document disagreement flow
 * Routes to appropriate sub-page based on document type:
 * - ToS/Privacy Policy → /legal/disagree/user (account deletion warning)
 * - DPA/Admin Terms → /legal/disagree/church (church deletion warning)
 */
export default async function DisagreePage({ searchParams }: DisagreePageProps) {
  try {
    const params = await searchParams
    const documentType = params.doc as
      | 'terms_of_service'
      | 'privacy_policy'
      | 'dpa'
      | 'church_admin_terms'
      | undefined

    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/signin?redirect=/legal/disagree')
    }

    // If no document type specified, show list of pending disagreements
    if (!documentType) {
      redirect('/legal/disagree/user')
    }

    // Validate document type
    const validTypes = ['terms_of_service', 'privacy_policy', 'dpa', 'church_admin_terms']
    if (!validTypes.includes(documentType)) {
      redirect('/legal/disagree/user')
    }

    // Determine route based on document type
    const isChurchDocument = documentType === 'dpa' || documentType === 'church_admin_terms'
    const basePath = isChurchDocument ? '/legal/disagree/church' : '/legal/disagree/user'

    // Get disagreement info
    const { data, error } = await getDisagreementInfo(documentType, params.id)

    if (error) {
      // Redirect to appropriate sub-page with error (they handle error display)
      redirect(`${basePath}?doc=${documentType}&id=${params.id || ''}&error=${encodeURIComponent(error)}`)
    }

    if (!data) {
      // Redirect to appropriate sub-page without data (they'll show pending disagreements or handle it)
      redirect(`${basePath}?doc=${documentType}&id=${params.id || ''}`)
    }

    // Route based on document type
    if (data.isChurchDeletion) {
      // DPA/Admin Terms → Church owner flow
      redirect(`/legal/disagree/church?doc=${documentType}&id=${data.id}`)
    } else {
      // ToS/Privacy Policy → User flow
      redirect(`/legal/disagree/user?doc=${documentType}&id=${data.id}`)
    }
  } catch (error) {
    // Re-throw redirect errors (they're intentional)
    if (isRedirectError(error)) {
      throw error
    }
    console.error('[DisagreePage] Error:', error)
    // Redirect to user page with error (it can display the error properly)
    redirect('/legal/disagree/user?error=' + encodeURIComponent('Failed to load disagreement page'))
  }
}
