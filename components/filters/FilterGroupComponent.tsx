'use client'

import { memo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { FilterRuleRow } from './FilterRuleRow'
import {
  type FilterFieldDefinition,
  type FilterGroup,
  type FilterRule,
  type OperatorsByType,
  createFilterRule,
} from '@/lib/filters/filter-types'

interface FilterGroupComponentProps {
  group: FilterGroup
  filterFields: FilterFieldDefinition[]
  operatorsByType: OperatorsByType
  showConjunction: boolean
  parentConjunction: 'and' | 'or'
  defaultField: string
  onParentConjunctionChange?: (conjunction: 'and' | 'or') => void
  onUpdate: (updatedGroup: FilterGroup) => void
  onRemove: () => void
}

export const FilterGroupComponent = memo(function FilterGroupComponent({
  group,
  filterFields,
  operatorsByType,
  showConjunction,
  parentConjunction,
  defaultField,
  onParentConjunctionChange,
  onUpdate,
  onRemove,
}: FilterGroupComponentProps) {
  const t = useTranslations('filter')
  const handleAddRule = useCallback(() => {
    onUpdate({
      ...group,
      rules: [...group.rules, createFilterRule(defaultField)],
    })
  }, [group, defaultField, onUpdate])

  const handleUpdateRule = useCallback(
    (ruleId: string, updates: Partial<FilterRule>) => {
      onUpdate({
        ...group,
        rules: group.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
      })
    },
    [group, onUpdate]
  )

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      onUpdate({
        ...group,
        rules: group.rules.filter((rule) => rule.id !== ruleId),
      })
    },
    [group, onUpdate]
  )

  const handleConjunctionChange = useCallback(
    (conjunction: 'and' | 'or') => {
      onUpdate({
        ...group,
        conjunction,
      })
    },
    [group, onUpdate]
  )

  return (
    <div className="flex gap-3">
      {/* Parent conjunction */}
      <div className="w-14 flex-shrink-0 pt-2">
        {showConjunction ? (
          onParentConjunctionChange ? (
            <button
              type="button"
              onClick={() => onParentConjunctionChange(parentConjunction === 'and' ? 'or' : 'and')}
              className="h-8 px-3 text-xs rounded-md border border-black/20 dark:border-white/20 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {t(parentConjunction)}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground px-2">
              {t(parentConjunction)}
            </span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2">{t('where')}</span>
        )}
      </div>

      {/* Group content */}
      <div className="flex-1 border border-black/20 dark:border-white/20 rounded-lg p-3 bg-muted/30 space-y-2">
        {group.rules.map((rule, index) => (
          <FilterRuleRow
            key={rule.id}
            rule={rule}
            filterFields={filterFields}
            operatorsByType={operatorsByType}
            showConjunction={index > 0}
            conjunction={group.conjunction}
            onConjunctionChange={index === 1 ? handleConjunctionChange : undefined}
            onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
            onRemove={() => handleRemoveRule(rule.id)}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1 text-xs !border !border-black/20 dark:!border-white/20"
          onClick={handleAddRule}
        >
          <Plus className="h-3 w-3" />
          {t('addRule')}
        </Button>
      </div>

      {/* Remove group button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0 mt-2"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
})
