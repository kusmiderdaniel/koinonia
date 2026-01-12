// Shared form types used by PublicFormClient and InternalFormClient
// Re-exports core types from lib/validations/forms for convenience

import type {
  ConditionOperator,
  ConditionAction,
  FieldType,
  SelectOption,
  SelectOptionI18n,
  TranslatedString,
  FieldSettings,
} from '@/lib/validations/forms'

// Re-export for convenience
export type {
  ConditionOperator,
  ConditionAction,
  FieldType,
  SelectOption,
  SelectOptionI18n,
  TranslatedString,
  FieldSettings,
}

// Simple form data for rendering
export interface FormData {
  id?: string
  title: string
  description: string | null
}

// Alias for backward compatibility
export type FieldOption = SelectOption
export type FieldOptionI18n = SelectOptionI18n

// Form field for rendering (display components)
export interface FormField {
  id: string
  type: FieldType
  label: string
  label_i18n?: TranslatedString | null
  description: string | null
  description_i18n?: TranslatedString | null
  placeholder: string | null
  placeholder_i18n?: TranslatedString | null
  required: boolean
  options: SelectOption[] | null
  options_i18n?: SelectOptionI18n[] | null
  settings: FieldSettings | null
  sort_order: number
}

// Form condition for conditional logic
export interface FormCondition {
  id: string
  target_field_id: string
  source_field_id: string
  operator: ConditionOperator
  value: string | null
  action: ConditionAction
}

// Form state types
export type FormValues = Record<string, unknown>
export type FormErrors = Record<string, string>
