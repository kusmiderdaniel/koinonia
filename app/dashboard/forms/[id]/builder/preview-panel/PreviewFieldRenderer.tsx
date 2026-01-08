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
import { useIsMobile } from '@/lib/hooks'
import { getOptionColorClasses } from './types'
import type { FieldRendererProps } from './types'

export function PreviewFieldRenderer({
  field,
  value,
  error,
  weekStartsOn,
  onValueChange,
  onMultiSelectChange,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <FieldWrapper field={field}>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            className="text-sm"
          />
        </FieldWrapper>
      )

    case 'textarea':
      return (
        <FieldWrapper field={field} fullWidth>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            rows={3}
            className="text-sm"
          />
        </FieldWrapper>
      )

    case 'number':
      return <NumberField field={field} value={value} error={error} onValueChange={onValueChange} />

    case 'email':
      return (
        <FieldWrapper field={field}>
          <Input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className="text-sm"
          />
        </FieldWrapper>
      )

    case 'date':
      return <DateField field={field} value={value} weekStartsOn={weekStartsOn} onValueChange={onValueChange} />

    case 'single_select':
      return <SingleSelectField field={field} value={value} onValueChange={onValueChange} />

    case 'multi_select':
      return <MultiSelectField field={field} value={value} onMultiSelectChange={onMultiSelectChange} />

    case 'checkbox':
      return (
        <div key={field.id} className="flex items-start space-x-2">
          <Checkbox
            id={`preview-${field.id}`}
            checked={(value as boolean) || false}
            onCheckedChange={(checked) => onValueChange(field.id, checked === true)}
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
}

// Wrapper component for standard fields
interface FieldWrapperProps {
  field: FieldRendererProps['field']
  children: React.ReactNode
  error?: string
  fullWidth?: boolean
}

function FieldWrapper({ field, children, error, fullWidth = false }: FieldWrapperProps) {
  const isMobile = useIsMobile()

  return (
    <div key={field.id} className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <div className={fullWidth || isMobile ? '' : 'w-1/2'}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

// Number field with prefix/suffix support
function NumberField({
  field,
  value,
  error,
  onValueChange,
}: Pick<FieldRendererProps, 'field' | 'value' | 'error' | 'onValueChange'>) {
  const numberSettings = field.settings?.number
  const decimals = numberSettings?.decimals ?? 0
  const step = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1'
  const format = numberSettings?.format || 'number'
  const prefix = format === 'currency' ? '$' : ''
  const suffix = format === 'percentage' ? '%' : ''

  return (
    <FieldWrapper field={field} error={error}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={(value as string) || ''}
          onChange={(e) => onValueChange(field.id, e.target.value)}
          placeholder={field.placeholder || undefined}
          step={step}
          min={numberSettings?.min ?? undefined}
          max={numberSettings?.max ?? undefined}
          className={cn(
            'text-sm',
            prefix && 'pl-7',
            suffix && 'pr-7',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  )
}

// Date field with calendar picker
function DateField({
  field,
  value,
  weekStartsOn,
  onValueChange,
}: Pick<FieldRendererProps, 'field' | 'value' | 'weekStartsOn' | 'onValueChange'>) {
  const dateValue = value ? new Date(value as string) : undefined

  return (
    <FieldWrapper field={field}>
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
            onSelect={(date) => onValueChange(field.id, date ? format(date, 'yyyy-MM-dd') : '')}
            weekStartsOn={weekStartsOn}
            className="p-3"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  )
}

// Single select dropdown
function SingleSelectField({
  field,
  value,
  onValueChange,
}: Pick<FieldRendererProps, 'field' | 'value' | 'onValueChange'>) {
  const selectedOption = field.options?.find(o => o.value === value)
  const colorClasses = selectedOption ? getOptionColorClasses(selectedOption.color) : null

  return (
    <FieldWrapper field={field}>
      <Select
        value={(value as string) || ''}
        onValueChange={(v) => onValueChange(field.id, v)}
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
    </FieldWrapper>
  )
}

// Multi select with checkboxes
function MultiSelectField({
  field,
  value,
  onMultiSelectChange,
}: Pick<FieldRendererProps, 'field' | 'value' | 'onMultiSelectChange'>) {
  const currentValues = (value as string[]) || []

  return (
    <FieldWrapper field={field}>
      <div className="space-y-2">
        {field.options?.map((option) => {
          const isChecked = currentValues.includes(option.value)
          const optionColor = getOptionColorClasses(option.color)
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`preview-${field.id}-${option.value}`}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  onMultiSelectChange(field.id, option.value, checked === true)
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
    </FieldWrapper>
  )
}
