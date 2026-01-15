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

/**
 * Verify that a record belongs to the user's church.
 * This is a common pattern used across many server actions.
 *
 * @example
 * const { data: form, error } = await verifyChurchOwnership(
 *   adminClient,
 *   'forms',
 *   formId,
 *   profile.church_id
 * )
 * if (error) return { error }
 */
export async function verifyChurchOwnership<T extends { church_id: string }>(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  table: string,
  id: string,
  churchId: string,
  selectFields: string = 'church_id',
  errorMessage: string = 'Not found'
): Promise<{ data?: T; error?: string }> {
  const { data, error: fetchError } = await adminClient
    .from(table)
    .select(selectFields)
    .eq('id', id)
    .single()

  if (fetchError || !data) {
    return { error: errorMessage }
  }

  // Type assertion needed due to Supabase's dynamic return types
  const record = data as unknown as { church_id: string }
  if (record.church_id !== churchId) {
    return { error: errorMessage }
  }

  return { data: data as unknown as T }
}

/**
 * Unwrap a Supabase nested relation that may be returned as T or T[].
 * This handles Supabase's inconsistent return types for joined data.
 *
 * @example
 * const song = unwrapRelation(section.songs) // { church_id: string }
 * const ministry = unwrapRelation(position.ministry) // MinistryData
 */
export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

/**
 * Verify ownership of a child record through its parent relationship.
 * Use when checking ownership via a joined table (e.g., song_sections -> songs -> church_id).
 *
 * @example
 * const { data: section } = await adminClient
 *   .from('song_sections')
 *   .select('song_id, songs!inner(church_id)')
 *   .eq('id', sectionId)
 *   .single()
 *
 * const error = verifyNestedOwnership(section?.songs, profile.church_id, 'Section not found')
 * if (error) return { error }
 */
export function verifyNestedOwnership(
  relation: { church_id: string } | { church_id: string }[] | null | undefined,
  churchId: string,
  errorMessage: string = 'Not found'
): string | null {
  const parent = unwrapRelation(relation)
  if (!parent || parent.church_id !== churchId) {
    return errorMessage
  }
  return null
}

/**
 * Generic result type for server actions
 */
export type ActionResult<T> = { data: T } | { error: string }

/**
 * Higher-order function that wraps server actions with authentication.
 * Eliminates the repeated auth boilerplate pattern across server actions.
 *
 * @example
 * // Before (repeated in every action):
 * export async function getProfile() {
 *   const auth = await getAuthenticatedUserWithProfile()
 *   if (isAuthError(auth)) return { error: auth.error }
 *   const { profile, adminClient } = auth
 *   // ... action logic
 * }
 *
 * // After (using withAuth):
 * export async function getProfile() {
 *   return withAuth(async ({ profile, adminClient }) => {
 *     // ... action logic
 *     return { data: result }
 *   })
 * }
 */
export async function withAuth<T>(
  action: (auth: AuthResult) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) {
    return { error: auth.error }
  }
  return action(auth)
}

/**
 * Variant of withAuth that requires a specific role.
 * Returns an error if the user doesn't have the required role.
 *
 * @example
 * export async function deleteChurch() {
 *   return withAuthRole(['owner', 'admin'], async ({ profile, adminClient }) => {
 *     // Only owners and admins can delete churches
 *     return { data: { success: true } }
 *   }, 'delete this church')
 * }
 */
export async function withAuthRole<T>(
  allowedRoles: string[],
  action: (auth: AuthResult) => Promise<ActionResult<T>>,
  actionDescription: string = 'perform this action'
): Promise<ActionResult<T>> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) {
    return { error: auth.error }
  }

  const roleError = requireRole(auth.profile.role, allowedRoles, actionDescription)
  if (roleError) {
    return { error: roleError }
  }

  return action(auth)
}

/**
 * Variant of withAuth that requires admin permissions (owner, admin).
 *
 * @example
 * export async function updateChurchSettings() {
 *   return withAdminAuth(async ({ profile, adminClient }) => {
 *     // Only admins can update church settings
 *     return { data: { success: true } }
 *   }, 'update church settings')
 * }
 */
export async function withAdminAuth<T>(
  action: (auth: AuthResult) => Promise<ActionResult<T>>,
  actionDescription: string = 'perform this action'
): Promise<ActionResult<T>> {
  return withAuthRole(['owner', 'admin'], action, actionDescription)
}

/**
 * Variant of withAuth that requires management permissions (owner, admin, leader).
 *
 * @example
 * export async function createEvent() {
 *   return withManageAuth(async ({ profile, adminClient }) => {
 *     // Owners, admins, and leaders can create events
 *     return { data: { success: true } }
 *   }, 'create events')
 * }
 */
export async function withManageAuth<T>(
  action: (auth: AuthResult) => Promise<ActionResult<T>>,
  actionDescription: string = 'manage this resource'
): Promise<ActionResult<T>> {
  return withAuthRole(['owner', 'admin', 'leader'], action, actionDescription)
}
