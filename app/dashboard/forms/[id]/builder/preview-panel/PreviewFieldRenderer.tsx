'use client'

import { useTranslations, useLocale } from 'next-intl'
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
import { enUS, pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks'
import { getOptionColorClasses } from './types'
import type { FieldRendererProps } from './types'

const localeMap = {
  en: enUS,
  pl: pl,
} as const

export function PreviewFieldRenderer({
  field,
  value,
  error,
  weekStartsOn,
  onValueChange,
  onMultiSelectChange,
  locale,
}: FieldRendererProps) {
  const t = useTranslations('forms.fieldPlaceholders')

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
      return <DateField field={field} value={value} weekStartsOn={weekStartsOn} onValueChange={onValueChange} pickDateLabel={t('pickDate')} locale={locale} />

    case 'single_select':
      return <SingleSelectField field={field} value={value} onValueChange={onValueChange} selectOptionLabel={t('selectOption')} />

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

    case 'divider':
      return <DividerField field={field} />

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
  pickDateLabel,
  locale: localeProp,
}: Pick<FieldRendererProps, 'field' | 'value' | 'weekStartsOn' | 'onValueChange' | 'locale'> & { pickDateLabel: string }) {
  const appLocale = useLocale()
  // Use provided locale (for multilingual form preview) or fall back to app locale
  const locale = localeProp || appLocale
  const dateLocale = localeMap[locale as keyof typeof localeMap] || enUS
  const dateValue = value ? new Date(value as string) : undefined

  return (
    <FieldWrapper field={field}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal text-sm !border !border-black/20 dark:!border-white/20',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, 'PPP', { locale: dateLocale }) : pickDateLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 !border !border-black/20 dark:!border-white/20 shadow-md" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => onValueChange(field.id, date ? format(date, 'yyyy-MM-dd') : '')}
            weekStartsOn={weekStartsOn}
            locale={dateLocale}
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
  selectOptionLabel,
}: Pick<FieldRendererProps, 'field' | 'value' | 'onValueChange'> & { selectOptionLabel: string }) {
  // Deduplicate options by value (Radix Select requires unique values)
  const uniqueOptions = field.options?.filter(
    (option: { value: string }, index: number, self: Array<{ value: string }>) =>
      self.findIndex((o) => o.value === option.value) === index
  )

  const selectedOption = uniqueOptions?.find((o: { value: string }) => o.value === value)
  const colorClasses = selectedOption ? getOptionColorClasses(selectedOption.color) : null

  return (
    <FieldWrapper field={field}>
      <Select
        value={(value as string) || ''}
        onValueChange={(v) => onValueChange(field.id, v)}
      >
        <SelectTrigger
          className={`text-sm ${selectedOption && colorClasses ? `${colorClasses.bg} ${colorClasses.text} font-medium` : ''}`}
        >
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <SelectValue placeholder={selectOptionLabel} />
          )}
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4} className="!border !border-black/20 dark:!border-white/20">
          {uniqueOptions?.map((option: { value: string; label: string; color?: string | null }) => {
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

  // Deduplicate options by value
  const uniqueOptions = field.options?.filter(
    (option: { value: string }, index: number, self: Array<{ value: string }>) =>
      self.findIndex((o) => o.value === option.value) === index
  )

  return (
    <FieldWrapper field={field}>
      <div className="space-y-2">
        {uniqueOptions?.map((option: { value: string; label: string; color?: string | null }) => {
          const isChecked = currentValues.includes(option.value)
          const optionColor = getOptionColorClasses(option.color)
          return (
            <div
              key={option.value}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-md ${optionColor.bg} ${optionColor.text}`}
            >
              <Checkbox
                id={`preview-${field.id}-${option.value}`}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  onMultiSelectChange(field.id, option.value, checked === true)
                }
              />
              <Label
                htmlFor={`preview-${field.id}-${option.value}`}
                className="text-xs font-medium cursor-pointer"
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

// Divider field
function DividerField({
  field,
}: Pick<FieldRendererProps, 'field'>) {
  const showTitle = field.settings?.divider?.showTitle ?? false

  if (showTitle && field.label) {
    return (
      <div key={field.id} className="flex items-center gap-3 py-2">
        <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-8 shrink-0" />
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {field.label}
        </span>
        <div className="h-px bg-zinc-300 dark:bg-zinc-600 flex-1" />
      </div>
    )
  }

  return (
    <div key={field.id} className="py-2">
      <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-full" />
    </div>
  )
}
