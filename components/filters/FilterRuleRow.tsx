'use client'

import { memo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { FilterValueInput } from './FilterValueInput'
import {
  type FilterFieldDefinition,
  type FilterRule,
  type OperatorsByType,
  getDefaultOperator,
  operatorNeedsValue,
} from '@/lib/filters/filter-types'

interface FilterRuleRowProps {
  rule: FilterRule
  filterFields: FilterFieldDefinition[]
  operatorsByType: OperatorsByType
  showConjunction: boolean
  conjunction: 'and' | 'or'
  onConjunctionChange?: (conjunction: 'and' | 'or') => void
  onUpdate: (updates: Partial<FilterRule>) => void
  onRemove: () => void
}

export const FilterRuleRow = memo(function FilterRuleRow({
  rule,
  filterFields,
  operatorsByType,
  showConjunction,
  conjunction,
  onConjunctionChange,
  onUpdate,
  onRemove,
}: FilterRuleRowProps) {
  const t = useTranslations('filter')
  const field = filterFields.find((f) => f.id === rule.field)
  const operators = field ? operatorsByType[field.type] ?? [] : []
  const needsValue = operatorNeedsValue(rule.operator)

  const handleFieldChange = useCallback(
    (fieldId: string) => {
      const newField = filterFields.find((f) => f.id === fieldId)
      if (newField) {
        onUpdate({
          field: fieldId,
          operator: getDefaultOperator(newField.type),
          value: newField.type === 'boolean' ? true : '',
        })
      }
    },
    [filterFields, onUpdate]
  )

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-3">
        {/* Conjunction */}
        <div className="w-14 flex-shrink-0">
          {showConjunction ? (
            onConjunctionChange ? (
              <button
                type="button"
                onClick={() => onConjunctionChange(conjunction === 'and' ? 'or' : 'and')}
                className="h-8 px-3 text-xs rounded-md border border-black/20 dark:border-white/20 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {t(conjunction)}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground px-2">
                {t(conjunction)}
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground px-2">{t('where')}</span>
          )}
        </div>

        {/* Field selector */}
        <Select value={rule.field} onValueChange={handleFieldChange}>
          <SelectTrigger className="flex-1 sm:w-[130px] h-8 text-xs !border !border-black/20 dark:!border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black/20 dark:border-white/20">
            {filterFields.map((f) => (
              <SelectItem
                key={f.id}
                value={f.id}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Remove button - visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0 sm:hidden"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 pl-16 sm:pl-0">
        {/* Operator selector */}
        <Select value={rule.operator} onValueChange={(v) => onUpdate({ operator: v })}>
          <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs !border !border-black/20 dark:!border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black/20 dark:border-white/20">
            {operators.map((op) => (
              <SelectItem
                key={op.value}
                value={op.value}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value input */}
        {needsValue && <FilterValueInput field={field} rule={rule} onUpdate={onUpdate} />}

        {/* Remove button - visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0 hidden sm:flex"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
