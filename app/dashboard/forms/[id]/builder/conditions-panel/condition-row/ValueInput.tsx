'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FieldOption {
  value: string
  label: string
  color?: string | null
}

interface ValueInputProps {
  conditionId: string
  value: string | null
  isDate: boolean
  hasOptions: boolean
  isMultiValue: boolean
  options: FieldOption[] | null | undefined
  isMobile: boolean
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  onChange: (value: string) => void
}

export const ValueInput = memo(function ValueInput({
  conditionId,
  value,
  isDate,
  hasOptions,
  isMultiValue,
  options,
  isMobile,
  weekStartsOn,
  onChange,
}: ValueInputProps) {
  const t = useTranslations('forms')

  if (isDate) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal !border !border-black dark:!border-white',
              isMobile ? 'h-7 text-xs' : 'h-8 text-sm',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className={isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} />
            {value
              ? format(new Date(value), isMobile ? 'PP' : 'PPP')
              : isMobile ? t('conditions.pickDateMobile') : t('conditions.pickDate')}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            weekStartsOn={weekStartsOn}
            className="p-3"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  if (isMultiValue && options) {
    const selectedValues: string[] = value ? JSON.parse(value) : []

    return (
      <div className={`border rounded-md bg-background ${isMobile ? 'space-y-1 p-1.5' : 'space-y-2 p-2'}`}>
        {options.map((option) => {
          const isChecked = selectedValues.includes(option.value)
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`condition-${conditionId}-${option.value}`}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  const newValues = checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((v) => v !== option.value)
                  onChange(JSON.stringify(newValues))
                }}
              />
              <Label
                htmlFor={`condition-${conditionId}-${option.value}`}
                className={`font-normal cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                {option.label}
              </Label>
            </div>
          )
        })}
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('conditions.noOptions')}</p>
        )}
      </div>
    )
  }

  if (hasOptions && options) {
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}>
          <SelectValue placeholder={isMobile ? t('conditions.selectValueMobile') : t('conditions.selectValue')} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          align="start"
          className="!border !border-black dark:!border-white"
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isMobile ? t('conditions.enterValueMobile') : t('conditions.enterValue')}
      className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
    />
  )
})
