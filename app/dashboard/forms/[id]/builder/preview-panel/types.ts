import { optionColors } from '@/lib/validations/forms'
import type { BuilderField, BuilderCondition } from '../../../types'

export type { BuilderField, BuilderCondition }

export interface PreviewPanelProps {
  onClose?: () => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface PreviewState {
  values: Record<string, unknown>
  errors: Record<string, string>
}

export interface FieldRendererProps {
  field: BuilderField
  value: unknown
  error?: string
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  onValueChange: (fieldId: string, value: unknown) => void
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
  locale?: string
}

export function getOptionColorClasses(colorName: string | null | undefined) {
  if (!colorName) return { bg: '!bg-zinc-200 dark:!bg-zinc-700', text: '!text-zinc-800 dark:!text-zinc-100' }
  const color = optionColors.find(c => c.name === colorName)
  return color || { bg: '!bg-zinc-200 dark:!bg-zinc-700', text: '!text-zinc-800 dark:!text-zinc-100' }
}
