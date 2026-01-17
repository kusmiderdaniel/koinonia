import type { FormField } from '../types'

export interface BaseFieldProps {
  field: FormField
  value: unknown
  error?: string
  onValueChange: (fieldId: string, value: unknown) => void
}

export interface MultiSelectFieldProps extends BaseFieldProps {
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
}

export interface DateFieldProps extends BaseFieldProps {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  locale?: string
}
