/**
 * Generic filter evaluation functions that can be used by any domain-specific filter logic.
 * Each function handles a specific field type and its operators.
 */

/**
 * Evaluate a text field rule
 */
export function evaluateTextRule(value: string | null, operator: string, filterValue: string): boolean {
  const normalizedValue = (value || '').toLowerCase()
  const normalizedFilter = (filterValue || '').toLowerCase()

  switch (operator) {
    case 'contains':
      return normalizedValue.includes(normalizedFilter)
    case 'not_contains':
      return !normalizedValue.includes(normalizedFilter)
    case 'equals':
      return normalizedValue === normalizedFilter
    case 'not_equals':
      return normalizedValue !== normalizedFilter
    case 'starts_with':
      return normalizedValue.startsWith(normalizedFilter)
    case 'ends_with':
      return normalizedValue.endsWith(normalizedFilter)
    case 'is_empty':
      return !value || value.trim() === ''
    case 'is_not_empty':
      return !!value && value.trim() !== ''
    default:
      return true
  }
}

/**
 * Evaluate a select field rule
 */
export function evaluateSelectRule(value: string | null, operator: string, filterValue: string): boolean {
  switch (operator) {
    case 'is':
    case 'equals':
      return value === filterValue
    case 'is_not':
    case 'not_equals':
      return value !== filterValue
    case 'is_empty':
      return !value
    case 'is_not_empty':
      return !!value
    default:
      return true
  }
}

/**
 * Evaluate a boolean field rule
 */
export function evaluateBooleanRule(value: boolean, operator: string, filterValue: boolean): boolean {
  switch (operator) {
    case 'is':
    case 'equals':
      return value === filterValue
    default:
      return true
  }
}

/**
 * Evaluate a date field rule
 */
export function evaluateDateRule(value: string | null, operator: string, filterValue: string): boolean {
  switch (operator) {
    case 'is_empty':
      return !value
    case 'is_not_empty':
      return !!value
    case 'is':
    case 'equals':
      if (!value || !filterValue) return false
      return new Date(value).toDateString() === new Date(filterValue).toDateString()
    case 'is_before':
    case 'before':
      if (!value || !filterValue) return false
      return new Date(value) < new Date(filterValue)
    case 'is_after':
    case 'after':
      if (!value || !filterValue) return false
      return new Date(value) > new Date(filterValue)
    default:
      return true
  }
}

/**
 * Evaluate a number field rule
 */
export function evaluateNumberRule(value: number | null, operator: string, filterValue: string): boolean {
  const numFilter = parseFloat(filterValue)

  switch (operator) {
    case 'is_empty':
      return value === null
    case 'is_not_empty':
      return value !== null
    case 'eq':
    case 'equals':
      return value === numFilter
    case 'neq':
    case 'not_equals':
      return value !== numFilter
    case 'lt':
      return value !== null && value < numFilter
    case 'gt':
      return value !== null && value > numFilter
    case 'lte':
      return value !== null && value <= numFilter
    case 'gte':
      return value !== null && value >= numFilter
    default:
      return true
  }
}

/**
 * Evaluate a multi-select field rule
 */
export function evaluateMultiSelectRule(values: string[], operator: string, filterValue: string): boolean {
  const normalizedValues = values.map(v => v.toLowerCase())
  const normalizedFilter = (filterValue || '').toLowerCase()

  switch (operator) {
    case 'contains':
      return normalizedValues.some(v => v.includes(normalizedFilter))
    case 'not_contains':
      return !normalizedValues.some(v => v.includes(normalizedFilter))
    case 'is_empty':
      return values.length === 0
    case 'is_not_empty':
      return values.length > 0
    default:
      return true
  }
}

/**
 * Infer filter type from a value
 */
export function inferTypeFromValue(value: string | boolean | number | null | string[]): string {
  if (value === null || value === undefined) return 'text'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'multiSelect'
  if (typeof value === 'string') {
    // Check if it looks like a date (YYYY-MM-DD format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    return 'text'
  }
  return 'text'
}
