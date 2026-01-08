'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getOptionColorClasses } from '../utils'
import { FieldWrapper } from './FieldWrapper'
import type { MultiSelectFieldProps } from './types'

export function MultiSelectField({
  field,
  value,
  error,
  onMultiSelectChange,
}: MultiSelectFieldProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <div className="space-y-2">
        {field.options?.map((option) => {
          const currentValues = (value as string[]) || []
          const isChecked = currentValues.includes(option.value)
          const optionColor = getOptionColorClasses(option.color)
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  onMultiSelectChange(field.id, option.value, checked === true)
                }
              />
              <Label
                htmlFor={`${field.id}-${option.value}`}
                className={`px-2 py-0.5 rounded-full text-sm font-medium cursor-pointer ${optionColor.bg} ${optionColor.text}`}
              >
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    </FieldWrapper>
  )
}
