'use client'

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
  const selectedOption = field.options?.find((o) => o.value === value)
  const colorClasses = selectedOption
    ? getOptionColorClasses(selectedOption.color)
    : null

  return (
    <FieldWrapper field={field} error={error}>
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
    </FieldWrapper>
  )
}
