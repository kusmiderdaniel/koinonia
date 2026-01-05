'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { optionColors } from '@/lib/validations/forms'
import { submitInternalForm } from '../../actions/submissions'

const getOptionColorClasses = (colorName: string | null | undefined) => {
  if (!colorName) return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
  const color = optionColors.find(c => c.name === colorName)
  return color || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
}

interface FormData {
  title: string
  description: string | null
}

interface NumberSettings {
  format?: 'number' | 'currency' | 'percentage'
  min?: number | null
  max?: number | null
  decimals?: number
}

interface FieldSettings {
  number?: NumberSettings
}

interface FormField {
  id: string
  type: string
  label: string
  description: string | null
  placeholder: string | null
  required: boolean
  options: { value: string; label: string; color?: string | null }[] | null
  settings: FieldSettings | null
  sort_order: number
}

interface FormCondition {
  id: string
  target_field_id: string
  source_field_id: string
  operator: string
  value: string | null
  action: string
}

interface Respondent {
  id: string
  name: string
  email: string
}

interface InternalFormClientProps {
  formId: string
  form: FormData
  fields: FormField[]
  conditions: FormCondition[]
  respondent: Respondent
  hasExistingSubmission: boolean
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function InternalFormClient({
  formId,
  form,
  fields,
  conditions,
  respondent,
  hasExistingSubmission,
  weekStartsOn = 0,
}: InternalFormClientProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Evaluate conditional logic
  const evaluateCondition = useCallback((condition: FormCondition): boolean => {
    const sourceValue = values[condition.source_field_id]

    switch (condition.operator) {
      case 'equals':
        return sourceValue === condition.value
      case 'not_equals':
        return sourceValue !== condition.value
      case 'contains': {
        if (Array.isArray(sourceValue)) {
          return sourceValue.includes(condition.value || '')
        }
        return String(sourceValue || '').includes(condition.value || '')
      }
      case 'does_not_contain': {
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
        return false
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
    // Clear error when user changes value
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }, [errors])

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

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    for (const field of visibleFields) {
      if (field.required) {
        const value = values[field.id]
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required'
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Please select at least one option'
        }
      }

      // Email validation
      if (field.type === 'email' && values[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(values[field.id]))) {
          newErrors[field.id] = 'Please enter a valid email address'
        }
      }

      // Number validation
      if (field.type === 'number' && values[field.id] !== undefined && values[field.id] !== '') {
        if (isNaN(Number(values[field.id]))) {
          newErrors[field.id] = 'Please enter a valid number'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [visibleFields, values])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Build responses object with only visible field values
      const responses: Record<string, unknown> = {}
      for (const field of visibleFields) {
        if (values[field.id] !== undefined) {
          responses[field.id] = values[field.id]
        }
      }

      const result = await submitInternalForm({ formId, responses })

      if (result.error) {
        throw new Error(result.error)
      }

      setIsSubmitted(true)
      toast.success('Form submitted successfully!')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit form')
    } finally {
      setIsSubmitting(false)
    }
  }, [formId, visibleFields, values, validateForm])

  const renderField = useCallback((field: FormField) => {
    const value = values[field.id]
    const error = errors[field.id]

    const fieldWrapper = (children: React.ReactNode, fullWidth = false) => (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-base font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        <div className={fullWidth ? '' : 'w-1/2'}>
          {children}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )

    switch (field.type) {
      case 'text':
        return fieldWrapper(
          <Input
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'textarea':
        return fieldWrapper(
          <Textarea
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />,
          true
        )

      case 'number': {
        const numberSettings = field.settings?.number
        const decimals = numberSettings?.decimals ?? 0
        const step = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1'
        const numberFormat = numberSettings?.format || 'number'
        const prefix = numberFormat === 'currency' ? '$' : ''
        const suffix = numberFormat === 'percentage' ? '%' : ''

        return fieldWrapper(
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
              onChange={(e) => handleValueChange(field.id, e.target.value)}
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
        )
      }

      case 'email':
        return fieldWrapper(
          <Input
            id={field.id}
            type="email"
            value={(value as string) || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'date': {
        const dateValue = value ? new Date(value as string) : undefined
        return fieldWrapper(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={field.id}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal !border !border-black dark:!border-white',
                  !value && 'text-muted-foreground',
                  error && '!border-red-500'
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
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              {selectedOption && colorClasses ? (
                <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${colorClasses.bg} ${colorClasses.text}`}>
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
                    <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${optionColor.bg} ${optionColor.text}`}>
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
                    id={`${field.id}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleMultiSelectChange(field.id, option.value, checked === true)
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
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={field.id}
                checked={(value as boolean) || false}
                onCheckedChange={(checked) => handleValueChange(field.id, checked === true)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor={field.id} className="text-base font-medium cursor-pointer">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-red-500 ml-7">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }, [values, errors, handleValueChange, handleMultiSelectChange])

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
          <p className="text-muted-foreground mb-6">
            Your response has been submitted successfully.
          </p>

          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Warning for existing submission */}
        {hasExistingSubmission && (
          <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              You have already submitted a response to this form. Submitting again will create a new response.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b bg-gradient-to-br from-brand/5 to-transparent">
            <h1 className="text-2xl md:text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="mt-2 text-muted-foreground">{form.description}</p>
            )}
          </div>

          {/* Respondent info */}
          <div className="px-6 md:px-8 py-4 bg-muted/30 border-b">
            <p className="text-sm text-muted-foreground">
              Responding as <span className="font-medium text-foreground">{respondent.name || respondent.email}</span>
            </p>
          </div>

          {/* Fields */}
          <div className="p-6 md:p-8 space-y-6">
            {visibleFields.map(renderField)}
          </div>

          {/* Submit */}
          <div className="p-6 md:p-8 border-t bg-muted/30">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 h-9 rounded-full text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 flex items-center justify-center"
              style={{ backgroundColor: '#f49f1e' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
