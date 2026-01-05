'use client'

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
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getOptionColorClasses } from './utils'
import type { FormField, FormValues, FormErrors } from './types'

interface FormFieldRendererProps {
  field: FormField
  value: unknown
  error?: string
  onValueChange: (fieldId: string, value: unknown) => void
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

function FieldWrapper({
  field,
  error,
  fullWidth = false,
  children,
}: {
  field: FormField
  error?: string
  fullWidth?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <div className={fullWidth ? '' : 'w-1/2'}>{children}</div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export function FormFieldRenderer({
  field,
  value,
  error,
  onValueChange,
  onMultiSelectChange,
  weekStartsOn = 0,
}: FormFieldRendererProps) {
  switch (field.type) {
    case 'text':
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

    case 'textarea':
      return (
        <FieldWrapper field={field} error={error} fullWidth>
          <Textarea
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
        </FieldWrapper>
      )

    case 'number': {
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

    case 'email':
      return (
        <FieldWrapper field={field} error={error}>
          <Input
            id={field.id}
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className={error ? 'border-red-500' : ''}
          />
        </FieldWrapper>
      )

    case 'date': {
      const dateValue = value ? new Date(value as string) : undefined
      return (
        <FieldWrapper field={field} error={error}>
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
            <PopoverContent
              className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md"
              align="start"
            >
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) =>
                  onValueChange(field.id, date ? format(date, 'yyyy-MM-dd') : '')
                }
                weekStartsOn={weekStartsOn}
                className="p-3"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FieldWrapper>
      )
    }

    case 'single_select': {
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

    case 'multi_select':
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

    case 'checkbox':
      return (
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id={field.id}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) =>
                onValueChange(field.id, checked === true)
              }
              className="mt-1"
            />
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

    default:
      return null
  }
}

interface FormFieldsProps {
  fields: FormField[]
  values: FormValues
  errors: FormErrors
  onValueChange: (fieldId: string, value: unknown) => void
  onMultiSelectChange: (fieldId: string, optionValue: string, checked: boolean) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function FormFields({
  fields,
  values,
  errors,
  onValueChange,
  onMultiSelectChange,
  weekStartsOn = 0,
}: FormFieldsProps) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <FormFieldRenderer
          key={field.id}
          field={field}
          value={values[field.id]}
          error={errors[field.id]}
          onValueChange={onValueChange}
          onMultiSelectChange={onMultiSelectChange}
          weekStartsOn={weekStartsOn}
        />
      ))}
    </div>
  )
}
