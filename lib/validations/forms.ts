import { z } from 'zod'

// Field types
export const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'email',
  'date',
  'single_select',
  'multi_select',
  'checkbox',
])
export type FieldType = z.infer<typeof fieldTypeSchema>

// Form status
export const formStatusSchema = z.enum(['draft', 'published', 'closed'])
export type FormStatus = z.infer<typeof formStatusSchema>

// Form access type
export const formAccessTypeSchema = z.enum(['public', 'internal', 'internal_anonymous'])
export type FormAccessType = z.infer<typeof formAccessTypeSchema>

// Condition operators
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'does_not_contain',
  'is_empty',
  'is_not_empty',
  'before',
  'before_or_equal',
  'after',
  'after_or_equal',
  'is_any_of',
  'is_not_any_of',
  'is_every_of',
])
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>

// Condition action
export const conditionActionSchema = z.enum(['show', 'hide'])
export type ConditionAction = z.infer<typeof conditionActionSchema>

// Option colors for select fields
export const optionColors = [
  { name: 'gray', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' },
  { name: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
  { name: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200' },
] as const

export type OptionColorName = (typeof optionColors)[number]['name']

// Select option schema (for single_select and multi_select fields)
export const selectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  color: z.string().optional().nullable(),
})
export type SelectOption = z.infer<typeof selectOptionSchema>

// Number format type
export const numberFormatSchema = z.enum(['number', 'currency', 'percentage'])
export type NumberFormat = z.infer<typeof numberFormatSchema>

// Number field settings
export const numberSettingsSchema = z.object({
  format: numberFormatSchema.default('number'),
  min: z.number().optional().nullable(),
  max: z.number().optional().nullable(),
  decimals: z.number().int().min(0).max(10).default(0),
})
export type NumberSettings = z.infer<typeof numberSettingsSchema>

// Field settings (type-specific)
export const fieldSettingsSchema = z.object({
  number: numberSettingsSchema.optional(),
})
export type FieldSettings = z.infer<typeof fieldSettingsSchema>

// Form schema (for creating/updating forms)
export const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  accessType: formAccessTypeSchema.default('internal'),
  allowMultipleSubmissions: z.boolean().optional(),
})
export type FormInput = z.infer<typeof formSchema>

// Form field schema
export const formFieldSchema = z.object({
  id: z.string().uuid().optional(),
  type: fieldTypeSchema,
  label: z.string().min(1, 'Label is required').max(200, 'Label must be 200 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  placeholder: z.string().max(200, 'Placeholder must be 200 characters or less').optional().nullable(),
  required: z.boolean().default(false),
  options: z.array(selectOptionSchema).optional().nullable(),
  settings: fieldSettingsSchema.optional().nullable(),
  sortOrder: z.number().int().min(0),
})
export type FormFieldInput = z.infer<typeof formFieldSchema>

// Form condition schema
export const formConditionSchema = z.object({
  id: z.string().uuid().optional(),
  targetFieldId: z.string().uuid(),
  sourceFieldId: z.string().uuid(),
  operator: conditionOperatorSchema,
  value: z.string().optional().nullable(),
  action: conditionActionSchema.default('show'),
})
export type FormConditionInput = z.infer<typeof formConditionSchema>

// Schema for form submission (dynamic based on fields)
export function createSubmissionSchema(fields: Array<{ id: string; type: FieldType; required: boolean }>) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Invalid email address')
        break
      case 'number':
        fieldSchema = z.coerce.number()
        break
      case 'date':
        fieldSchema = z.string().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date')
        break
      case 'checkbox':
        fieldSchema = z.boolean()
        break
      case 'multi_select':
        fieldSchema = z.array(z.string())
        break
      case 'text':
      case 'textarea':
      case 'single_select':
      default:
        fieldSchema = z.string()
    }

    if (!field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = fieldSchema.optional()
      } else if (field.type === 'multi_select') {
        fieldSchema = z.array(z.string()).optional().default([])
      } else {
        fieldSchema = fieldSchema.optional().nullable().or(z.literal(''))
      }
    }

    shape[field.id] = fieldSchema
  }

  return z.object(shape)
}

// Public form submission schema
export const publicFormSubmissionSchema = z.object({
  formToken: z.string().min(1),
  responses: z.record(z.string(), z.unknown()),
  email: z.string().email().optional().nullable(),
})
export type PublicFormSubmissionInput = z.infer<typeof publicFormSubmissionSchema>

// Internal form submission schema
export const internalFormSubmissionSchema = z.object({
  formId: z.string().uuid(),
  responses: z.record(z.string(), z.unknown()),
})
export type InternalFormSubmissionInput = z.infer<typeof internalFormSubmissionSchema>
