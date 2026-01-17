'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getOptionColorClasses } from '../utils'
import { FieldWrapper } from './FieldWrapper'
import type { BaseFieldProps } from './types'

export function SingleSelectField({ field, value, error, onValueChange }: BaseFieldProps) {
  const t = useTranslations('forms.fieldPlaceholders')
  const [mounted, setMounted] = useState(false)

  // Deduplicate options by value (Radix Select requires unique values)
  const uniqueOptions = field.options?.filter(
    (option, index, self) => self.findIndex((o) => o.value === option.value) === index
  )

  const selectedOption = uniqueOptions?.find((o) => o.value === value)
  const colorClasses = selectedOption
    ? getOptionColorClasses(selectedOption.color)
    : null

  // Prevent hydration mismatch from Radix UI ID generation
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <FieldWrapper field={field} error={error}>
      {mounted ? (
        <Select
          value={(value as string) || ''}
          onValueChange={(v) => onValueChange(field.id, v)}
        >
          <SelectTrigger
            className={`${error ? 'border-red-500' : ''} ${selectedOption && colorClasses ? `${colorClasses.bg} ${colorClasses.text} font-medium` : ''}`}
          >
            {selectedOption ? (
              <span>{selectedOption.label}</span>
            ) : (
              <SelectValue placeholder={t('selectOption')} />
            )}
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="!border !border-black/20 dark:!border-white/20"
          >
            {uniqueOptions?.map((option) => {
              const optionColor = getOptionColorClasses(option.color)
              return (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={`${optionColor.bg} ${optionColor.text} font-medium`}
                >
                  {option.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ${error ? 'border-red-500' : ''}`}>
          <span className="text-muted-foreground">{t('selectOption')}</span>
        </div>
      )}
    </FieldWrapper>
  )
}
