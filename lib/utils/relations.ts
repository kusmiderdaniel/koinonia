/**
 * Utility for safely unwrapping Supabase relation types.
 *
 * Supabase relations can return:
 * - A single object when the relation exists
 * - An array with one element (for some join types)
 * - null when no relation exists
 *
 * This utility normalizes these cases to a single object or null.
 */

/**
 * Unwrap a Supabase relation to a single object or null.
 *
 * @example
 * // Instead of:
 * const church = profile.churches as { name?: string } | null
 * const churchName = church?.name ?? ''
 *
 * // Use:
 * const church = unwrapRelation<{ name?: string }>(profile.churches)
 * const churchName = church?.name ?? ''
 *
 * @param relation - The relation value from Supabase (can be object, array, or null)
 * @returns The unwrapped object or null
 */
export function unwrapRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (relation === null || relation === undefined) {
    return null
  }
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }
  return relation
}

/**
 * Unwrap a Supabase relation with a default value.
 *
 * @example
 * const church = unwrapRelationWithDefault(profile.churches, { name: 'Unknown' })
 * // church is guaranteed to have 'name' property
 *
 * @param relation - The relation value from Supabase
 * @param defaultValue - Default value to return if relation is null/undefined
 * @returns The unwrapped object or the default value
 */
export function unwrapRelationWithDefault<T>(
  relation: T | T[] | null | undefined,
  defaultValue: T
): T {
  const unwrapped = unwrapRelation(relation)
  return unwrapped ?? defaultValue
}

/**
 * Safely access a property from a Supabase relation.
 *
 * @example
 * // Instead of:
 * const firstDayOfWeek = ((profile.churches as { first_day_of_week?: number } | null)?.first_day_of_week ?? 0)
 *
 * // Use:
 * const firstDayOfWeek = getRelationProperty(profile.churches, 'first_day_of_week', 0)
 *
 * @param relation - The relation value from Supabase
 * @param property - The property key to access
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or default
 */
export function getRelationProperty<T, K extends keyof T>(
  relation: T | T[] | null | undefined,
  property: K,
  defaultValue: NonNullable<T[K]>
): NonNullable<T[K]> {
  const unwrapped = unwrapRelation(relation)
  if (unwrapped === null || unwrapped === undefined) {
    return defaultValue
  }
  const value = unwrapped[property]
  return (value ?? defaultValue) as NonNullable<T[K]>
}
