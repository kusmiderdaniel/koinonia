'use client'

import { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const selectedOption = field.options?.find((o) => o.value === value)
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
          <SelectTrigger className={error ? 'border-red-500' : ''}>
            {selectedOption && colorClasses ? (
              <span
                className={`px-2 py-0.5 rounded-full text-sm font-medium ${colorClasses.bg} ${colorClasses.text}`}
              >
                {selectedOption.label}
              </span>
            ) : (
              <SelectValue placeholder="Select an option" />
            )}
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="!border !border-black dark:!border-white"
          >
            {field.options?.map((option) => {
              const optionColor = getOptionColorClasses(option.color)
              return (
                <SelectItem key={option.value} value={option.value}>
                  <span
                    className={`px-2 py-0.5 rounded-full text-sm font-medium ${optionColor.bg} ${optionColor.text}`}
                  >
                    {option.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ${error ? 'border-red-500' : ''}`}>
          <span className="text-muted-foreground">Select an option</span>
        </div>
      )}
    </FieldWrapper>
  )
}
