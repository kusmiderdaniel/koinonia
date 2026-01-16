import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/permissions'

interface AdminAuthResult {
  authorized: true
  user: { id: string; email?: string }
  profile: { id: string; user_id: string; is_super_admin: boolean | null }
  adminClient: ReturnType<typeof createServiceRoleClient>
}

interface AdminAuthError {
  authorized: false
  error: string
}

/**
 * Checks if the current user is authenticated and has super admin permissions.
 *
 * This should be called at the start of all admin server actions to ensure
 * only authorized users can access admin functionality.
 *
 * @returns AdminAuthResult if authorized, AdminAuthError otherwise
 */
export async function requireSuperAdmin(): Promise<AdminAuthResult | AdminAuthError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, user_id, is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile || !isSuperAdmin(profile)) {
    return { authorized: false, error: 'Not authorized' }
  }

  return {
    authorized: true,
    user,
    profile,
    adminClient,
  }
}

/**
 * Type guard to check if the auth result is an error
 */
export function isAdminAuthError(
  result: AdminAuthResult | AdminAuthError
): result is AdminAuthError {
  return !result.authorized
}
