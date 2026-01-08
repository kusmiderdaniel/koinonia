'use client'

import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from './FieldWrapper'
import type { BaseFieldProps } from './types'

export function TextareaField({ field, value, error, onValueChange }: BaseFieldProps) {
  return (
    <FieldWrapper field={field} error={error} fullWidth>
      <Textarea
        id={field.id}
        value={(value as string) || ''}
        onChange={(e) => onValueChange(field.id, e.target.value)}
        placeholder={field.placeholder || undefined}
        rows={4}
        className={error ? 'border-red-500' : ''}
      />
    </FieldWrapper>
  )
}
