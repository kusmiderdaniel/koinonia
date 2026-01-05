import type { NumberFormat } from '@/lib/validations/forms'

export const NUMBER_FORMATS: { value: NumberFormat; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'percentage', label: 'Percentage (%)' },
]
