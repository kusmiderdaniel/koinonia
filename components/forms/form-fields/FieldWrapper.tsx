'use client'

import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks'
import type { FormField } from '../types'

interface FieldWrapperProps {
  field: FormField
  error?: string
  fullWidth?: boolean
  children: React.ReactNode
}

export function FieldWrapper({
  field,
  error,
  fullWidth = false,
  children,
}: FieldWrapperProps) {
  const isMobile = useIsMobile()

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <div className={fullWidth || isMobile ? '' : 'w-1/2'}>{children}</div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
