/**
 * Custom Fields Types
 *
 * Types for the custom fields feature that allows churches to define
 * their own fields in the People table with various types.
 */

// Field types supported
export type CustomFieldType = 'text' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'number'

// Option for select/multiselect fields
export interface SelectOption {
  value: string
  label: string
  color?: string // Hex color for badge styling
}

// Settings for number fields
export interface NumberSettings {
  format?: 'number' | 'currency' | 'percentage'
  decimals?: number
  prefix?: string // e.g., "$", "PLN "
  suffix?: string // e.g., "%", " kg"
  min?: number
  max?: number
}

// Field definition (schema) stored in custom_field_definitions table
export interface CustomFieldDefinition {
  id: string
  church_id: string
  name: string
  field_type: CustomFieldType
  description: string | null
  options: SelectOption[] // For select/multiselect
  settings: NumberSettings // For number fields
  display_order: number
  default_visible: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Value stored in custom_field_values table
export interface CustomFieldValue {
  id: string
  church_id: string
  profile_id: string
  field_id: string
  value: CustomFieldValueType
  updated_by: string | null
  updated_at: string
}

// Possible value types based on field_type
export type CustomFieldValueType =
  | string // text, date (ISO string), select
  | string[] // multiselect
  | boolean // checkbox
  | number // number
  | null

// Input for creating a custom field definition
export interface CreateCustomFieldInput {
  name: string
  field_type: CustomFieldType
  description?: string | null
  options?: SelectOption[]
  settings?: NumberSettings
  default_visible?: boolean
}

// Input for updating a custom field definition
export interface UpdateCustomFieldInput {
  name?: string
  description?: string | null
  options?: SelectOption[]
  settings?: NumberSettings
  default_visible?: boolean
  // Note: field_type cannot be changed after creation
}

// Result type for server actions
export interface CustomFieldActionResult<T = CustomFieldDefinition> {
  success?: boolean
  error?: string
  data?: T
}

// Map of field_id -> value for a member
export type CustomFieldValuesMap = Record<string, CustomFieldValueType>

// Helper to get default value for a field type
export function getDefaultValueForFieldType(fieldType: CustomFieldType): CustomFieldValueType {
  switch (fieldType) {
    case 'text':
      return null
    case 'date':
      return null
    case 'select':
      return null
    case 'multiselect':
      return []
    case 'checkbox':
      return false
    case 'number':
      return null
    default:
      return null
  }
}

// Helper to format number value based on settings
export function formatNumberValue(value: number | null, settings: NumberSettings): string {
  if (value === null || value === undefined) return '—'

  const { format = 'number', decimals = 0, prefix = '', suffix = '' } = settings

  let formatted: string

  switch (format) {
    case 'currency':
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      break
    case 'percentage':
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      break
    default:
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
  }

  return `${prefix}${formatted}${suffix}`
}

// Helper to validate value against field type
export function validateFieldValue(
  value: CustomFieldValueType,
  fieldType: CustomFieldType,
  settings?: NumberSettings
): { valid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { valid: true } // Null is always valid (optional field)
  }

  switch (fieldType) {
    case 'text':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be a string' }
      }
      break

    case 'date':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be a date string' }
      }
      // Basic ISO date format check
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { valid: false, error: 'Date must be in YYYY-MM-DD format' }
      }
      break

    case 'select':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be a string' }
      }
      break

    case 'multiselect':
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Value must be an array' }
      }
      if (!value.every((v) => typeof v === 'string')) {
        return { valid: false, error: 'All values must be strings' }
      }
      break

    case 'checkbox':
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Value must be a boolean' }
      }
      break

    case 'number':
      if (typeof value !== 'number') {
        return { valid: false, error: 'Value must be a number' }
      }
      if (settings?.min !== undefined && value < settings.min) {
        return { valid: false, error: `Value must be at least ${settings.min}` }
      }
      if (settings?.max !== undefined && value > settings.max) {
        return { valid: false, error: `Value must be at most ${settings.max}` }
      }
      break
  }

  return { valid: true }
}
