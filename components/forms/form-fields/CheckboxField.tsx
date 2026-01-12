'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { BaseFieldProps } from './types'

export function CheckboxField({ field, value, error, onValueChange }: BaseFieldProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch from Radix UI ID generation
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        {mounted ? (
          <Checkbox
            id={field.id}
            checked={(value as boolean) || false}
            onCheckedChange={(checked) =>
              onValueChange(field.id, checked === true)
            }
            className="mt-1"
          />
        ) : (
          <div className="h-4 w-4 shrink-0 rounded-sm border border-primary mt-1" />
        )}
        <div className="space-y-1">
          <Label
            htmlFor={field.id}
            className="text-base font-medium cursor-pointer"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">
              {field.description}
            </p>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 ml-7">{error}</p>}
    </div>
  )
}
