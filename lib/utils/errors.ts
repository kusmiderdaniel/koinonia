/**
 * Standardized error handling utilities for server actions
 */

// Standard result type for server actions
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Convenience type for actions that only return error/success
export type SimpleActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'production') {
      // Check for known error types that are safe to expose
      if (error.message.includes('duplicate key')) {
        return 'This item already exists'
      }
      if (error.message.includes('foreign key')) {
        return 'Referenced item not found'
      }
      if (error.message.includes('not found')) {
        return 'Item not found'
      }
      if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        return 'You are not authorized to perform this action'
      }
      return 'An unexpected error occurred. Please try again.'
    }
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Wrap an async operation with standardized error handling
 *
 * @param operation - The async operation to execute
 * @param context - Description of the operation for logging
 * @returns ActionResult with data on success or error message on failure
 *
 * @example
 * const result = await withErrorHandling(
 *   async () => {
 *     const data = await fetchData()
 *     return data
 *   },
 *   'fetchUserProfile'
 * )
 *
 * if (!result.success) {
 *   return { error: result.error }
 * }
 * return { data: result.data }
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<ActionResult<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    console.error(`[Error] ${context}:`, error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Wrap an async operation that doesn't return data
 *
 * @example
 * const result = await withSimpleErrorHandling(
 *   async () => {
 *     await deleteItem(id)
 *   },
 *   'deleteItem'
 * )
 *
 * if (!result.success) {
 *   return { error: result.error }
 * }
 * return { success: true }
 */
export async function withSimpleErrorHandling(
  operation: () => Promise<void>,
  context: string
): Promise<SimpleActionResult> {
  try {
    await operation()
    return { success: true }
  } catch (error) {
    console.error(`[Error] ${context}:`, error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Type guard to check if a result is an error
 */
export function isActionError<T>(
  result: ActionResult<T>
): result is { success: false; error: string } {
  return !result.success
}

/**
 * Type guard to check if a result is successful
 */
export function isActionSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T } {
  return result.success
}

/**
 * Common error messages for reuse
 */
export const ErrorMessages = {
  NOT_AUTHENTICATED: 'You must be signed in to perform this action',
  NOT_AUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested item was not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
} as const

/**
 * Create a standardized error response for server actions
 */
export function errorResponse(message: string): { error: string } {
  return { error: message }
}

/**
 * Create a standardized success response for server actions
 */
export function successResponse<T>(data: T): { data: T } {
  return { data }
}
