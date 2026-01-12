import type { Database } from '@/types/supabase'
import type { FieldType, FormStatus, FormAccessType, ConditionOperator, ConditionAction, SelectOption, SelectOptionI18n, TranslatedString, FieldSettings } from '@/lib/validations/forms'

// Base types from database
export type DbForm = Database['public']['Tables']['forms']['Row']
export type DbFormField = Database['public']['Tables']['form_fields']['Row']
export type DbFormCondition = Database['public']['Tables']['form_conditions']['Row']
export type DbFormSubmission = Database['public']['Tables']['form_submissions']['Row']

// Form with typed enums
export interface Form extends Omit<DbForm, 'status' | 'access_type' | 'title_i18n' | 'description_i18n'> {
  status: FormStatus
  access_type: FormAccessType
  title_i18n: TranslatedString | null
  description_i18n: TranslatedString | null
}

// Form field with typed enums
export interface FormField extends Omit<DbFormField, 'type' | 'options' | 'options_i18n' | 'label_i18n' | 'description_i18n' | 'placeholder_i18n' | 'settings'> {
  type: FieldType
  options: SelectOption[] | null
  options_i18n: SelectOptionI18n[] | null
  label_i18n: TranslatedString | null
  description_i18n: TranslatedString | null
  placeholder_i18n: TranslatedString | null
  settings: FieldSettings | null
}

// Form condition with typed enums
export interface FormCondition extends Omit<DbFormCondition, 'operator' | 'action'> {
  operator: ConditionOperator
  action: ConditionAction
}

// Form submission with parsed responses
export interface FormSubmission extends Omit<DbFormSubmission, 'responses'> {
  responses: Record<string, unknown>
  respondent?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

// Form with relations (for display)
export interface FormWithRelations extends Form {
  fields?: FormField[]
  conditions?: FormCondition[]
  submissions_count?: number
  creator?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

// Form field for builder (client-side with temporary IDs)
export interface BuilderField extends Omit<FormField, 'id' | 'form_id' | 'created_at' | 'updated_at'> {
  id: string // Can be temp ID before save
  form_id?: string
  isNew?: boolean
}

// Form condition for builder
export interface BuilderCondition extends Omit<FormCondition, 'id' | 'form_id' | 'created_at'> {
  id: string // Can be temp ID before save
  form_id?: string
  isNew?: boolean
}

// Field type metadata for palette
export interface FieldTypeInfo {
  type: FieldType
  label: string
  icon: string // Icon component name
  description: string
  hasOptions: boolean
}

// Available field types with metadata
export const FIELD_TYPES: FieldTypeInfo[] = [
  { type: 'text', label: 'Short Text', icon: 'Type', description: 'Single line text input', hasOptions: false },
  { type: 'textarea', label: 'Long Text', icon: 'AlignLeft', description: 'Multi-line text input', hasOptions: false },
  { type: 'number', label: 'Number', icon: 'Hash', description: 'Numeric input', hasOptions: false },
  { type: 'email', label: 'Email', icon: 'Mail', description: 'Email address input', hasOptions: false },
  { type: 'date', label: 'Date', icon: 'Calendar', description: 'Date picker', hasOptions: false },
  { type: 'single_select', label: 'Dropdown', icon: 'ChevronDown', description: 'Single choice from options', hasOptions: true },
  { type: 'multi_select', label: 'Multi Select', icon: 'CheckSquare', description: 'Multiple choices from options', hasOptions: true },
  { type: 'checkbox', label: 'Checkbox', icon: 'Square', description: 'Yes/No toggle', hasOptions: false },
]

// Condition operator metadata
export interface ConditionOperatorInfo {
  operator: ConditionOperator
  label: string
  description: string
  requiresValue: boolean
}

export const CONDITION_OPERATORS: ConditionOperatorInfo[] = [
  { operator: 'equals', label: 'Equals', description: 'Value equals specified text', requiresValue: true },
  { operator: 'not_equals', label: 'Not Equals', description: 'Value does not equal specified text', requiresValue: true },
  { operator: 'contains', label: 'Contains', description: 'Value contains specified text', requiresValue: true },
  { operator: 'is_empty', label: 'Is Empty', description: 'Value is empty or not provided', requiresValue: false },
  { operator: 'is_not_empty', label: 'Is Not Empty', description: 'Value is not empty', requiresValue: false },
]

// Form builder state
export interface FormBuilderState {
  form: Form | null
  fields: BuilderField[]
  conditions: BuilderCondition[]
  selectedFieldId: string | null
  isDirty: boolean
  isSaving: boolean
  error: string | null
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

// Initial state for form builder
export const INITIAL_BUILDER_STATE: FormBuilderState = {
  form: null,
  fields: [],
  conditions: [],
  selectedFieldId: null,
  isDirty: false,
  isSaving: false,
  error: null,
  weekStartsOn: 0,
}

// Response table column
export interface ResponseColumn {
  id: string
  label: string
  type: FieldType
}

// Export formats
export type ExportFormat = 'csv' | 'xlsx'
