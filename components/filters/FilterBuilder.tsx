'use client'

import { useState, useCallback, memo } from 'react'
import { useIsMobile } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, Plus, Trash2 } from 'lucide-react'
import { FilterRuleRow } from './FilterRuleRow'
import { FilterGroupComponent } from './FilterGroupComponent'
import {
  type FilterState,
  type FilterRule,
  type FilterGroup,
  type FilterFieldDefinition,
  type OperatorsByType,
  DEFAULT_OPERATORS_BY_TYPE,
  createFilterRule,
  createFilterGroup,
  createEmptyFilterState,
  countActiveFilters,
} from '@/lib/filters/filter-types'

export interface FilterBuilderProps {
  /** Current filter state */
  filterState: FilterState
  /** Callback when filter state changes */
  onChange: (filterState: FilterState) => void
  /** Field definitions for this filter */
  filterFields: FilterFieldDefinition[]
  /** Custom operators by type (optional, uses defaults if not provided) */
  operatorsByType?: OperatorsByType
  /** Default field for new rules (defaults to first field) */
  defaultField?: string
}

export const FilterBuilder = memo(function FilterBuilder({
  filterState,
  onChange,
  filterFields,
  operatorsByType = DEFAULT_OPERATORS_BY_TYPE,
  defaultField,
}: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const activeFilterCount = countActiveFilters(filterState)
  const resolvedDefaultField = defaultField ?? filterFields[0]?.id ?? 'title'

  const handleAddRule = useCallback(() => {
    onChange({
      ...filterState,
      rules: [...filterState.rules, createFilterRule(resolvedDefaultField)],
    })
  }, [filterState, onChange, resolvedDefaultField])

  const handleAddGroup = useCallback(() => {
    onChange({
      ...filterState,
      groups: [...filterState.groups, createFilterGroup(resolvedDefaultField)],
    })
  }, [filterState, onChange, resolvedDefaultField])

  const handleUpdateRule = useCallback(
    (ruleId: string, updates: Partial<FilterRule>) => {
      onChange({
        ...filterState,
        rules: filterState.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        ),
      })
    },
    [filterState, onChange]
  )

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      onChange({
        ...filterState,
        rules: filterState.rules.filter((rule) => rule.id !== ruleId),
      })
    },
    [filterState, onChange]
  )

  const handleUpdateGroup = useCallback(
    (groupId: string, updatedGroup: FilterGroup) => {
      onChange({
        ...filterState,
        groups: filterState.groups.map((group) =>
          group.id === groupId ? updatedGroup : group
        ),
      })
    },
    [filterState, onChange]
  )

  const handleRemoveGroup = useCallback(
    (groupId: string) => {
      onChange({
        ...filterState,
        groups: filterState.groups.filter((group) => group.id !== groupId),
      })
    },
    [filterState, onChange]
  )

  const handleConjunctionChange = useCallback(
    (conjunction: 'and' | 'or') => {
      onChange({
        ...filterState,
        conjunction,
      })
    },
    [filterState, onChange]
  )

  const handleClearAll = useCallback(() => {
    onChange(createEmptyFilterState())
  }, [onChange])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {activeFilterCount} rule{activeFilterCount !== 1 ? 's' : ''}
              </span>
            </span>
          ) : (
            'Filter'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] max-w-[720px] p-0 bg-white dark:bg-zinc-950 border shadow-lg"
        align={isMobile ? 'center' : 'start'}
        sideOffset={8}
      >
        <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
          {/* Existing rules at root level */}
          {filterState.rules.map((rule, index) => (
            <FilterRuleRow
              key={rule.id}
              rule={rule}
              filterFields={filterFields}
              operatorsByType={operatorsByType}
              showConjunction={index > 0}
              conjunction={filterState.conjunction}
              onConjunctionChange={index > 0 ? handleConjunctionChange : undefined}
              onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
              onRemove={() => handleRemoveRule(rule.id)}
            />
          ))}

          {/* Filter groups */}
          {filterState.groups.map((group, index) => (
            <FilterGroupComponent
              key={group.id}
              group={group}
              filterFields={filterFields}
              operatorsByType={operatorsByType}
              showConjunction={filterState.rules.length > 0 || index > 0}
              parentConjunction={filterState.conjunction}
              defaultField={resolvedDefaultField}
              onParentConjunctionChange={
                // Any group showing conjunction can toggle it
                filterState.rules.length > 0 || index > 0
                  ? handleConjunctionChange
                  : undefined
              }
              onUpdate={(updatedGroup) => handleUpdateGroup(group.id, updatedGroup)}
              onRemove={() => handleRemoveGroup(group.id)}
            />
          ))}

          {/* Empty state */}
          {filterState.rules.length === 0 && filterState.groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No filters applied. Add a filter rule to get started.
            </p>
          )}

          {/* Add buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1"
              onClick={handleAddRule}
            >
              <Plus className="h-4 w-4" />
              Add filter rule
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1"
              onClick={handleAddGroup}
            >
              <Plus className="h-4 w-4" />
              Add filter group
            </Button>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
                Delete filter
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})
