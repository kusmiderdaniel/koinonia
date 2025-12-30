import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  church_id: string
  role: string
}

export interface AuthResult {
  user: { id: string; email?: string }
  profile: UserProfile
  adminClient: ReturnType<typeof createServiceRoleClient>
}

export interface AuthError {
  error: string
}

/**
 * Get the authenticated user and their profile in a single call.
 * This eliminates the repeated auth boilerplate in server actions.
 *
 * @returns Either { user, profile, adminClient } on success or { error } on failure
 *
 * @example
 * const auth = await getAuthenticatedUserWithProfile()
 * if ('error' in auth) {
 *   return { error: auth.error }
 * }
 * const { user, profile, adminClient } = auth
 */
export async function getAuthenticatedUserWithProfile(): Promise<AuthResult | AuthError> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be signed in' }
  }

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found' }
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile as UserProfile,
    adminClient,
  }
}

/**
 * Type guard to check if the auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result
}

/**
 * Helper to require a specific permission level.
 * Returns an error message if the user doesn't have the required role.
 *
 * @example
 * const permError = requireRole(profile.role, ['owner', 'admin'])
 * if (permError) return { error: permError }
 */
export function requireRole(
  userRole: string,
  allowedRoles: string[],
  action: string = 'perform this action'
): string | null {
  if (!allowedRoles.includes(userRole)) {
    return `You do not have permission to ${action}`
  }
  return null
}

/**
 * Helper to require management permissions (owner, admin, leader)
 */
export function requireManagePermission(
  userRole: string,
  action: string = 'manage this resource'
): string | null {
  return requireRole(userRole, ['owner', 'admin', 'leader'], action)
}

/**
 * Helper to require admin permissions (owner, admin)
 */
export function requireAdminPermission(
  userRole: string,
  action: string = 'perform this action'
): string | null {
  return requireRole(userRole, ['owner', 'admin'], action)
}
