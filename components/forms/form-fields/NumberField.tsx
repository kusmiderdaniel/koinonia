'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './FieldWrapper'
import type { BaseFieldProps } from './types'

export function NumberField({ field, value, error, onValueChange }: BaseFieldProps) {
  const numberSettings = field.settings?.number
  const decimals = numberSettings?.decimals ?? 0
  const step = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1'
  const numberFormat = numberSettings?.format || 'number'
  const prefix = numberFormat === 'currency' ? '$' : ''
  const suffix = numberFormat === 'percentage' ? '%' : ''

  return (
    <FieldWrapper field={field} error={error}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={field.id}
          type="number"
          value={(value as string) || ''}
          onChange={(e) => onValueChange(field.id, e.target.value)}
          placeholder={field.placeholder || undefined}
          step={step}
          min={numberSettings?.min ?? undefined}
          max={numberSettings?.max ?? undefined}
          className={`${error ? 'border-red-500' : ''} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  )
}
