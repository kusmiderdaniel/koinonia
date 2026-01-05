'use client'

import { memo } from 'react'
import { GitBranch } from 'lucide-react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import { ConditionRow } from './ConditionRow'

export const ConditionsPanel = memo(function ConditionsPanel() {
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
