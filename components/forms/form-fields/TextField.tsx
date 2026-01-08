'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './FieldWrapper'
import type { BaseFieldProps } from './types'

export function TextField({ field, value, error, onValueChange }: BaseFieldProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <Input
        id={field.id}
        value={(value as string) || ''}
        onChange={(e) => onValueChange(field.id, e.target.value)}
        placeholder={field.placeholder || undefined}
        className={error ? 'border-red-500' : ''}
      />
    </FieldWrapper>
  )
}
