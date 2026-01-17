'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FilterFieldDefinition, FilterRule } from '@/lib/filters/filter-types'

interface FilterValueInputProps {
  field: FilterFieldDefinition | undefined
  rule: FilterRule
  onUpdate: (updates: Partial<FilterRule>) => void
}

export const FilterValueInput = memo(function FilterValueInput({
  field,
  rule,
  onUpdate,
}: FilterValueInputProps) {
  const t = useTranslations('filter')
  const tCommon = useTranslations('common')

  if (!field) return null

  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2 h-8 px-3 border border-black/20 dark:border-white/20 rounded-md">
          <Checkbox
            checked={rule.value as boolean}
            onCheckedChange={(checked) => onUpdate({ value: checked as boolean })}
          />
          <span className="text-xs">{rule.value ? tCommon('yes') : tCommon('no')}</span>
        </div>
      )

    case 'select':
      return (
        <Select value={rule.value as string} onValueChange={(v) => onUpdate({ value: v })}>
          <SelectTrigger className="w-[120px] h-8 text-xs !border !border-black/20 dark:!border-white/20">
            <SelectValue placeholder={tCommon('select')} />
          </SelectTrigger>
          <SelectContent className="border border-black/20 dark:border-white/20">
            {field.options?.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'date':
      return (
        <Input
          type="date"
          value={(rule.value as string) || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="w-[140px] h-8 text-xs !border !border-black/20 dark:!border-white/20"
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={(rule.value as string) || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={t('valuePlaceholder')}
          className="w-[100px] h-8 text-xs !border !border-black/20 dark:!border-white/20"
        />
      )

    case 'text':
    case 'multiSelect':
    default:
      return (
        <Input
          type="text"
          value={(rule.value as string) || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={t('valuePlaceholder')}
          className="flex-1 min-w-[100px] h-8 text-xs !border !border-black/20 dark:!border-white/20"
        />
      )
  }
})
