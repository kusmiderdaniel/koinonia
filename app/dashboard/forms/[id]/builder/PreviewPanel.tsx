'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Eye, RotateCcw, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { optionColors } from '@/lib/validations/forms'
import type { BuilderField, BuilderCondition } from '../../types'

const getOptionColorClasses = (colorName: string | null | undefined) => {
  if (!colorName) return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
  const color = optionColors.find(c => c.name === colorName)
  return color || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
}

interface PreviewPanelProps {
  onClose?: () => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function PreviewPanel({ onClose, weekStartsOn: weekStartsOnProp }: PreviewPanelProps) {
  const { form, fields, conditions, weekStartsOn: weekStartsOnStore } = useFormBuilder()
  const weekStartsOn = weekStartsOnProp ?? weekStartsOnStore
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Evaluate conditional logic
  const evaluateCondition = useCallback((condition: BuilderCondition): boolean => {
    const sourceValue = values[condition.source_field_id]

    switch (condition.operator) {
      case 'equals':
        return sourceValue === condition.value
      case 'not_equals':
        return sourceValue !== condition.value
      case 'contains': {
        // For multi_select, check if array contains the value
        if (Array.isArray(sourceValue)) {
          return sourceValue.includes(condition.value || '')
        }
        return String(sourceValue || '').includes(condition.value || '')
      }
      case 'does_not_contain': {
        // For multi_select, check if array does not contain the value
        if (Array.isArray(sourceValue)) {
          return !sourceValue.includes(condition.value || '')
        }
        return !String(sourceValue || '').includes(condition.value || '')
      }
      case 'is_empty':
        if (Array.isArray(sourceValue)) return sourceValue.length === 0
        return !sourceValue || sourceValue === ''
      case 'is_not_empty':
        if (Array.isArray(sourceValue)) return sourceValue.length > 0
        return !!sourceValue && sourceValue !== ''
      case 'is_any_of': {
        const allowedValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return sourceValue.some((v) => allowedValues.includes(v))
        }
        return allowedValues.includes(String(sourceValue || ''))
      }
      case 'is_not_any_of': {
        const disallowedValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return !sourceValue.some((v) => disallowedValues.includes(v))
        }
        return !disallowedValues.includes(String(sourceValue || ''))
      }
      case 'is_every_of': {
        const requiredValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return requiredValues.every((v) => sourceValue.includes(v))
        }
        return false // Single value can't contain all of multiple values
      }
      case 'before':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) < new Date(condition.value)
      case 'before_or_equal':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) <= new Date(condition.value)
      case 'after':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) > new Date(condition.value)
      case 'after_or_equal':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) >= new Date(condition.value)
      default:
        return true
    }
  }, [values])

  // Get visible fields based on conditions
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      const fieldConditions = conditions.filter((c) => c.target_field_id === field.id)
      if (fieldConditions.length === 0) return true

      return fieldConditions.every((c) => {
        const conditionMet = evaluateCondition(c)
        return c.action === 'show' ? conditionMet : !conditionMet
      })
    })
  }, [fields, conditions, evaluateCondition])

  const handleValueChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))

    // Validate number fields
    const field = fields.find(f => f.id === fieldId)
    if (field?.type === 'number' && value !== '' && value !== undefined) {
      const numValue = Number(value)
      const numberSettings = field.settings?.number

      if (!isNaN(numValue)) {
        if (numberSettings?.min !== null && numberSettings?.min !== undefined && numValue < numberSettings.min) {
          setErrors(prev => ({ ...prev, [fieldId]: `Minimum value is ${numberSettings.min}` }))
          return
        }
        if (numberSettings?.max !== null && numberSettings?.max !== undefined && numValue > numberSettings.max) {
          setErrors(prev => ({ ...prev, [fieldId]: `Maximum value is ${numberSettings.max}` }))
          return
        }
      }
    }
    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldId]
      return newErrors
    })
  }, [fields])

  const handleMultiSelectChange = useCallback((fieldId: string, optionValue: string, checked: boolean) => {
    setValues((prev) => {
      const current = (prev[fieldId] as string[]) || []
      if (checked) {
        return { ...prev, [fieldId]: [...current, optionValue] }
      } else {
        return { ...prev, [fieldId]: current.filter((v) => v !== optionValue) }
      }
    })
  }, [])

  const handleReset = useCallback(() => {
    setValues({})
  }, [])

  const renderField = useCallback((field: BuilderField) => {
    const value = values[field.id]
    const error = errors[field.id]

    const fieldWrapper = (children: React.ReactNode, fieldError?: string, fullWidth = false) => (
      <div key={field.id} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <div className={fullWidth ? '' : 'w-1/2'}>
          {children}
        </div>
        {fieldError && (
          <p className="text-xs text-red-500">{fieldError}</p>
        )}
      </div>
    )

    switch (field.type) {
      case 'text':
        return fieldWrapper(
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            className="text-sm"
          />
        )

      case 'textarea':
        return fieldWrapper(
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            rows={3}
            className="text-sm"
          />,
          undefined,
          true
        )

      case 'number': {
        const numberSettings = field.settings?.number
        const decimals = numberSettings?.decimals ?? 0
        const step = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1'
        const format = numberSettings?.format || 'number'
        const prefix = format === 'currency' ? '$' : ''
        const suffix = format === 'percentage' ? '%' : ''

        return fieldWrapper(
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {prefix}
              </span>
            )}
            <Input
              type="number"
              value={(value as string) || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder={field.placeholder || undefined}
              step={step}
              min={numberSettings?.min ?? undefined}
              max={numberSettings?.max ?? undefined}
              className={`text-sm ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''} ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>,
          error
        )
      }

      case 'email':
        return fieldWrapper(
          <Input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className="text-sm"
          />
        )

      case 'date': {
        const dateValue = value ? new Date(value as string) : undefined
        return fieldWrapper(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal text-sm !border !border-black dark:!border-white',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => handleValueChange(field.id, date ? format(date, 'yyyy-MM-dd') : '')}
                weekStartsOn={weekStartsOn}
                className="p-3"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      }

      case 'single_select': {
        const selectedOption = field.options?.find(o => o.value === value)
        const colorClasses = selectedOption ? getOptionColorClasses(selectedOption.color) : null
        return fieldWrapper(
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => handleValueChange(field.id, v)}
          >
            <SelectTrigger className="text-sm">
              {selectedOption && colorClasses ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                  {selectedOption.label}
                </span>
              ) : (
                <SelectValue placeholder="Select an option" />
              )}
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="!border !border-black dark:!border-white">
              {field.options?.map((option) => {
                const optionColor = getOptionColorClasses(option.color)
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${optionColor.bg} ${optionColor.text}`}>
                      {option.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )
      }

      case 'multi_select':
        return fieldWrapper(
          <div className="space-y-2">
            {field.options?.map((option) => {
              const currentValues = (value as string[]) || []
              const isChecked = currentValues.includes(option.value)
              const optionColor = getOptionColorClasses(option.color)
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`preview-${field.id}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleMultiSelectChange(field.id, option.value, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`preview-${field.id}-${option.value}`}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${optionColor.bg} ${optionColor.text}`}
                  >
                    {option.label}
                  </Label>
                </div>
              )
            })}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-start space-x-2">
            <Checkbox
              id={`preview-${field.id}`}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => handleValueChange(field.id, checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor={`preview-${field.id}`} className="text-sm font-medium cursor-pointer">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }, [values, handleValueChange, handleMultiSelectChange])

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button size="sm" className="pointer-events-none !border !border-black dark:!border-white bg-white dark:bg-zinc-900">
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" onClick={handleReset} className="!border !border-black dark:!border-white bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-lg border shadow-sm overflow-hidden">
          {/* Form Header */}
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold text-lg">{form.title}</h2>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="p-4 space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Add fields to see them in preview
              </p>
            ) : visibleFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                All fields are hidden by conditions.
                <br />
                Change values above to show fields.
              </p>
            ) : (
              visibleFields.map(renderField)
            )}

            {fields.length > 0 && (
              <div className="pt-4">
                <button
                  type="button"
                  disabled
                  className="px-8 h-9 rounded-full text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#f49f1e' }}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden fields indicator */}
        {fields.length > 0 && fields.length !== visibleFields.length && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {fields.length - visibleFields.length} field(s) hidden by conditions
          </p>
        )}
      </div>
    </div>
  )
}
