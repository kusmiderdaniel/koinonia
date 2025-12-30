'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Filter, Plus, Trash2, X } from 'lucide-react'
import {
  FilterState,
  FilterRule,
  FilterGroup,
  FILTER_FIELDS,
  OPERATORS_BY_TYPE,
  createFilterRule,
  createFilterGroup,
  createEmptyFilterState,
  getDefaultOperator,
  operatorNeedsValue,
} from './filter-types'
import { countActiveFilters } from './filter-logic'

interface FilterBuilderProps {
  filterState: FilterState
  onChange: (filterState: FilterState) => void
}

export function FilterBuilder({ filterState, onChange }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeFilterCount = countActiveFilters(filterState)

  const handleAddRule = useCallback(() => {
    onChange({
      ...filterState,
      rules: [...filterState.rules, createFilterRule()],
    })
  }, [filterState, onChange])

  const handleAddGroup = useCallback(() => {
    onChange({
      ...filterState,
      groups: [...filterState.groups, createFilterGroup()],
    })
  }, [filterState, onChange])

  const handleUpdateRule = useCallback((ruleId: string, updates: Partial<FilterRule>) => {
    onChange({
      ...filterState,
      rules: filterState.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    })
  }, [filterState, onChange])

  const handleRemoveRule = useCallback((ruleId: string) => {
    onChange({
      ...filterState,
      rules: filterState.rules.filter(rule => rule.id !== ruleId),
    })
  }, [filterState, onChange])

  const handleUpdateGroup = useCallback((groupId: string, updatedGroup: FilterGroup) => {
    onChange({
      ...filterState,
      groups: filterState.groups.map(group =>
        group.id === groupId ? updatedGroup : group
      ),
    })
  }, [filterState, onChange])

  const handleRemoveGroup = useCallback((groupId: string) => {
    onChange({
      ...filterState,
      groups: filterState.groups.filter(group => group.id !== groupId),
    })
  }, [filterState, onChange])

  const handleConjunctionChange = useCallback((conjunction: 'and' | 'or') => {
    onChange({
      ...filterState,
      conjunction,
    })
  }, [filterState, onChange])

  const handleClearAll = useCallback(() => {
    onChange(createEmptyFilterState())
  }, [onChange])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
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
        className="w-[600px] p-0 bg-white dark:bg-zinc-950 border shadow-lg"
        align="start"
        sideOffset={8}
      >
        <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
          {/* Existing rules at root level */}
          {filterState.rules.map((rule, index) => (
            <FilterRuleRow
              key={rule.id}
              rule={rule}
              showConjunction={index > 0 || filterState.groups.length > 0}
              conjunction={filterState.conjunction}
              onConjunctionChange={index === 1 ? handleConjunctionChange : undefined}
              onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
              onRemove={() => handleRemoveRule(rule.id)}
            />
          ))}

          {/* Filter groups */}
          {filterState.groups.map((group, index) => (
            <FilterGroupComponent
              key={group.id}
              group={group}
              showConjunction={filterState.rules.length > 0 || index > 0}
              parentConjunction={filterState.conjunction}
              onParentConjunctionChange={
                filterState.rules.length === 0 && index === 1
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
}

// Filter Rule Row Component
interface FilterRuleRowProps {
  rule: FilterRule
  showConjunction: boolean
  conjunction: 'and' | 'or'
  onConjunctionChange?: (conjunction: 'and' | 'or') => void
  onUpdate: (updates: Partial<FilterRule>) => void
  onRemove: () => void
}

function FilterRuleRow({
  rule,
  showConjunction,
  conjunction,
  onConjunctionChange,
  onUpdate,
  onRemove,
}: FilterRuleRowProps) {
  const field = FILTER_FIELDS.find(f => f.id === rule.field)
  const operators = field ? OPERATORS_BY_TYPE[field.type] : []
  const needsValue = operatorNeedsValue(rule.operator)

  const handleFieldChange = (fieldId: string) => {
    const newField = FILTER_FIELDS.find(f => f.id === fieldId)
    if (newField) {
      onUpdate({
        field: fieldId,
        operator: getDefaultOperator(newField.type),
        value: newField.type === 'boolean' ? true : '',
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Conjunction */}
      <div className="w-14 flex-shrink-0">
        {showConjunction ? (
          onConjunctionChange ? (
            <Select value={conjunction} onValueChange={(v) => onConjunctionChange(v as 'and' | 'or')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">And</SelectItem>
                <SelectItem value="or">Or</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground px-2">{conjunction === 'and' ? 'And' : 'Or'}</span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2">Where</span>
        )}
      </div>

      {/* Field selector */}
      <Select value={rule.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_FIELDS.map(f => (
            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select value={rule.operator} onValueChange={(v) => onUpdate({ operator: v })}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map(op => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {needsValue && (
        <FilterValueInput
          field={field}
          rule={rule}
          onUpdate={onUpdate}
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Value Input Component
interface FilterValueInputProps {
  field: typeof FILTER_FIELDS[0] | undefined
  rule: FilterRule
  onUpdate: (updates: Partial<FilterRule>) => void
}

function FilterValueInput({ field, rule, onUpdate }: FilterValueInputProps) {
  if (!field) return null

  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2 h-8 px-3 border rounded-md">
          <Checkbox
            checked={rule.value as boolean}
            onCheckedChange={(checked) => onUpdate({ value: checked as boolean })}
          />
          <span className="text-xs">{rule.value ? 'Yes' : 'No'}</span>
        </div>
      )

    case 'select':
      return (
        <Select value={rule.value as string} onValueChange={(v) => onUpdate({ value: v })}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'date':
      return (
        <Input
          type="date"
          value={rule.value as string || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="w-[140px] h-8 text-xs"
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={rule.value as string || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="Value"
          className="w-[100px] h-8 text-xs"
        />
      )

    case 'text':
    case 'multiSelect':
    default:
      return (
        <Input
          type="text"
          value={rule.value as string || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="Value..."
          className="flex-1 min-w-[100px] h-8 text-xs"
        />
      )
  }
}

// Filter Group Component
interface FilterGroupComponentProps {
  group: FilterGroup
  showConjunction: boolean
  parentConjunction: 'and' | 'or'
  onParentConjunctionChange?: (conjunction: 'and' | 'or') => void
  onUpdate: (updatedGroup: FilterGroup) => void
  onRemove: () => void
}

function FilterGroupComponent({
  group,
  showConjunction,
  parentConjunction,
  onParentConjunctionChange,
  onUpdate,
  onRemove,
}: FilterGroupComponentProps) {
  const handleAddRule = () => {
    onUpdate({
      ...group,
      rules: [...group.rules, createFilterRule()],
    })
  }

  const handleUpdateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    onUpdate({
      ...group,
      rules: group.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    })
  }

  const handleRemoveRule = (ruleId: string) => {
    onUpdate({
      ...group,
      rules: group.rules.filter(rule => rule.id !== ruleId),
    })
  }

  const handleConjunctionChange = (conjunction: 'and' | 'or') => {
    onUpdate({
      ...group,
      conjunction,
    })
  }

  return (
    <div className="flex gap-2">
      {/* Parent conjunction */}
      <div className="w-14 flex-shrink-0 pt-2">
        {showConjunction ? (
          onParentConjunctionChange ? (
            <Select value={parentConjunction} onValueChange={(v) => onParentConjunctionChange(v as 'and' | 'or')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">And</SelectItem>
                <SelectItem value="or">Or</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground px-2">{parentConjunction === 'and' ? 'And' : 'Or'}</span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2">Where</span>
        )}
      </div>

      {/* Group content */}
      <div className="flex-1 border rounded-lg p-3 bg-muted/30 space-y-2">
        {group.rules.map((rule, index) => (
          <FilterRuleRow
            key={rule.id}
            rule={rule}
            showConjunction={index > 0}
            conjunction={group.conjunction}
            onConjunctionChange={index === 1 ? handleConjunctionChange : undefined}
            onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
            onRemove={() => handleRemoveRule(rule.id)}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1 text-xs"
          onClick={handleAddRule}
        >
          <Plus className="h-3 w-3" />
          Add filter rule
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
}
