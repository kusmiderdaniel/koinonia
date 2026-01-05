'use client'

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { Trash2, GitBranch, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import type { BuilderCondition } from '../../types'

const TEXT_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
] as const

const SINGLE_SELECT_OPERATORS = [
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'is_any_of', label: 'Is any of' },
  { value: 'is_not_any_of', label: 'Is not any of' },
] as const

const MULTI_SELECT_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'does_not_contain', label: 'Does not contain' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'is_any_of', label: 'Is any of' },
  { value: 'is_not_any_of', label: 'Is not any of' },
  { value: 'is_every_of', label: 'Is every of' },
] as const

const DATE_OPERATORS = [
  { value: 'equals', label: 'Is on' },
  { value: 'before', label: 'Is before' },
  { value: 'before_or_equal', label: 'Is on or before' },
  { value: 'after', label: 'Is after' },
  { value: 'after_or_equal', label: 'Is on or after' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
] as const

const ACTIONS = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
] as const

interface ConditionRowProps {
  condition: BuilderCondition
  fields: { id: string; label: string; type: string; options?: { value: string; label: string; color?: string | null }[] | null }[]
  onUpdate: (id: string, updates: Partial<BuilderCondition>) => void
  onDelete: (id: string) => void
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

const ConditionRow = memo(function ConditionRow({
  condition,
  fields,
  onUpdate,
  onDelete,
  weekStartsOn,
}: ConditionRowProps) {
  const needsValue = condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty'
  const sourceField = fields.find((f) => f.id === condition.source_field_id)
  const sourceHasOptions = sourceField?.type === 'single_select' || sourceField?.type === 'multi_select'
  const sourceIsDate = sourceField?.type === 'date'
  const sourceIsSingleSelect = sourceField?.type === 'single_select'
  const sourceIsMultiSelect = sourceField?.type === 'multi_select'
  const needsMultiValue = condition.operator === 'is_any_of' || condition.operator === 'is_not_any_of' || condition.operator === 'is_every_of'

  const operators = sourceIsDate
    ? DATE_OPERATORS
    : sourceIsSingleSelect
      ? SINGLE_SELECT_OPERATORS
      : sourceIsMultiSelect
        ? MULTI_SELECT_OPERATORS
        : TEXT_OPERATORS

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      {/* Action */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Action</Label>
        <Select
          value={condition.action}
          onValueChange={(value) => onUpdate(condition.id, { action: value as 'show' | 'hide' })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} align="start" className="!border !border-black dark:!border-white">
            {ACTIONS.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* When field */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">When</Label>
        <Select
          value={condition.source_field_id}
          onValueChange={(value) => onUpdate(condition.id, { source_field_id: value, value: null })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} align="start" className="!border !border-black dark:!border-white">
            {fields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Condition</Label>
        <Select
          value={condition.operator}
          onValueChange={(value) => onUpdate(condition.id, { operator: value as 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'before' | 'after' })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} align="start" className="!border !border-black dark:!border-white">
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value */}
      {needsValue && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Value</Label>
          {sourceIsDate ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-8 justify-start text-left font-normal text-sm !border !border-black dark:!border-white',
                    !condition.value && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {condition.value ? format(new Date(condition.value), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md" align="start">
                <Calendar
                  mode="single"
                  selected={condition.value ? new Date(condition.value) : undefined}
                  onSelect={(date) => onUpdate(condition.id, { value: date ? format(date, 'yyyy-MM-dd') : '' })}
                  weekStartsOn={weekStartsOn}
                  className="p-3"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : needsMultiValue && sourceField?.options ? (
            <div className="space-y-2 p-2 border rounded-md bg-background">
              {sourceField.options.map((option) => {
                const selectedValues: string[] = condition.value ? JSON.parse(condition.value) : []
                const isChecked = selectedValues.includes(option.value)
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condition-${condition.id}-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newValues = checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter((v) => v !== option.value)
                        onUpdate(condition.id, { value: JSON.stringify(newValues) })
                      }}
                    />
                    <Label
                      htmlFor={`condition-${condition.id}-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                )
              })}
              {sourceField.options.length === 0 && (
                <p className="text-xs text-muted-foreground">No options available</p>
              )}
            </div>
          ) : sourceHasOptions && sourceField?.options ? (
            <Select
              value={condition.value || ''}
              onValueChange={(value) => onUpdate(condition.id, { value })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select a value" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className="!border !border-black dark:!border-white">
                {sourceField.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={condition.value || ''}
              onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
              placeholder="Enter value"
              className="h-8 text-sm"
            />
          )}
        </div>
      )}

      {/* Delete button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(condition.id)}
        className="w-full !border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Remove condition
      </Button>
    </div>
  )
})

interface ConditionsPanelProps {
  onAddCondition?: () => void
  canAddCondition?: boolean
}

export const ConditionsPanel = memo(function ConditionsPanel({ onAddCondition, canAddCondition }: ConditionsPanelProps) {
  const {
    fields,
    conditions,
    selectedFieldId,
    updateCondition,
    deleteCondition,
    weekStartsOn,
  } = useFormBuilder()

  // Get conditions that target the selected field
  const fieldConditions = selectedFieldId
    ? conditions.filter((c) => c.target_field_id === selectedFieldId)
    : []

  // Get other fields that can be used as source for conditions
  // (fields that appear before the selected field in the form)
  const selectedFieldIndex = fields.findIndex((f) => f.id === selectedFieldId)
  const availableSourceFields = fields
    .filter((f, index) => f.id !== selectedFieldId && index < selectedFieldIndex)
    .map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options }))

  if (!selectedFieldId) {
    return null
  }

  if (selectedFieldIndex === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        The first field cannot have conditions.
        <br />
        Conditions are based on previous fields.
      </div>
    )
  }

  if (availableSourceFields.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Add fields above this one to create conditional logic.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4" />
        <span>Show/hide based on previous answers</span>
      </div>

      {fieldConditions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            No conditions yet. Add one to control when this field is visible.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fieldConditions.map((condition) => (
            <ConditionRow
              key={condition.id}
              condition={condition}
              fields={availableSourceFields}
              onUpdate={updateCondition}
              onDelete={deleteCondition}
              weekStartsOn={weekStartsOn}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Hook to get add condition handler
export function useConditionActions() {
  const {
    fields,
    conditions,
    selectedFieldId,
    addCondition,
  } = useFormBuilder()

  const selectedFieldIndex = fields.findIndex((f) => f.id === selectedFieldId)
  const availableSourceFields = fields
    .filter((f, index) => f.id !== selectedFieldId && index < selectedFieldIndex)
    .map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options }))

  const canAddCondition = selectedFieldId !== null && selectedFieldIndex > 0 && availableSourceFields.length > 0

  const handleAddCondition = useCallback(() => {
    if (!selectedFieldId || availableSourceFields.length === 0) return

    addCondition({
      target_field_id: selectedFieldId,
      source_field_id: availableSourceFields[0].id,
      operator: 'equals',
      value: '',
      action: 'show',
    })
  }, [selectedFieldId, availableSourceFields, addCondition])

  return { handleAddCondition, canAddCondition }
}
