'use client'

import {
  TextField,
  TextareaField,
  NumberField,
  EmailField,
  DateField,
  SingleSelectField,
  MultiSelectField,
  CheckboxField,
} from './form-fields'
import type { FormField, FormValues, FormErrors } from './types'

interface FormFieldRendererProps {
  field: FormField
  value: unknown
  error?: string
  onValueChange: (fieldId: string, value: unknown) => void
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function FormFieldRenderer({
  field,
  value,
  error,
  onValueChange,
  onMultiSelectChange,
  weekStartsOn = 0,
}: FormFieldRendererProps) {
  const baseProps = { field, value, error, onValueChange }

  switch (field.type) {
    case 'text':
      return <TextField {...baseProps} />

    case 'textarea':
      return <TextareaField {...baseProps} />

    case 'number':
      return <NumberField {...baseProps} />

    case 'email':
      return <EmailField {...baseProps} />

    case 'date':
      return <DateField {...baseProps} weekStartsOn={weekStartsOn} />

    case 'single_select':
      return <SingleSelectField {...baseProps} />

    case 'multi_select':
      return <MultiSelectField {...baseProps} onMultiSelectChange={onMultiSelectChange} />

    case 'checkbox':
      return <CheckboxField {...baseProps} />

    default:
      return null
  }
}

interface FormFieldsProps {
  fields: FormField[]
  values: FormValues
  errors: FormErrors
  onValueChange: (fieldId: string, value: unknown) => void
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function FormFields({
  fields,
  values,
  errors,
  onValueChange,
  onMultiSelectChange,
  weekStartsOn = 0,
}: FormFieldsProps) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <FormFieldRenderer
          key={field.id}
          field={field}
          value={values[field.id]}
          error={errors[field.id]}
          onValueChange={onValueChange}
          onMultiSelectChange={onMultiSelectChange}
          weekStartsOn={weekStartsOn}
        />
      ))}
    </div>
  )
}
