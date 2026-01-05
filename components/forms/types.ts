// Shared form types used by PublicFormClient and InternalFormClient

export interface FormData {
  id?: string
  title: string
  description: string | null
}

export interface NumberSettings {
  format?: 'number' | 'currency' | 'percentage'
  min?: number | null
  max?: number | null
  decimals?: number
}

export interface FieldSettings {
  number?: NumberSettings
}

export interface FieldOption {
  value: string
  label: string
  color?: string | null
}

export interface FormField {
  id: string
  type: string
  label: string
  description: string | null
  placeholder: string | null
  required: boolean
  options: FieldOption[] | null
  settings: FieldSettings | null
  sort_order: number
}

export interface FormCondition {
  id: string
  target_field_id: string
  source_field_id: string
  operator: string
  value: string | null
  action: string
}

export type FormValues = Record<string, unknown>
export type FormErrors = Record<string, string>
