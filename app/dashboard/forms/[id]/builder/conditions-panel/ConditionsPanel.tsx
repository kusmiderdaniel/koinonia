'use client'

import { memo } from 'react'
import { GitBranch } from 'lucide-react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import { ConditionRow } from './ConditionRow'
import { useIsMobile } from '@/lib/hooks'

export const ConditionsPanel = memo(function ConditionsPanel() {
  const {
    fields,
    conditions,
    selectedFieldId,
    updateCondition,
    deleteCondition,
    weekStartsOn,
  } = useFormBuilder()
  const isMobile = useIsMobile()

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
      <div className={`text-muted-foreground text-center ${isMobile ? 'text-xs py-2' : 'text-sm py-4'}`}>
        {isMobile ? (
          'First field cannot have conditions.'
        ) : (
          <>
            The first field cannot have conditions.
            <br />
            Conditions are based on previous fields.
          </>
        )}
      </div>
    )
  }

  if (availableSourceFields.length === 0) {
    return (
      <div className={`text-muted-foreground text-center ${isMobile ? 'text-xs py-2' : 'text-sm py-4'}`}>
        Add fields above to create conditional logic.
      </div>
    )
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
      {!isMobile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          <span>Show/hide based on previous answers</span>
        </div>
      )}

      {fieldConditions.length === 0 ? (
        <div className={`text-center ${isMobile ? 'py-2' : 'py-4'}`}>
          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isMobile ? 'No conditions yet.' : 'No conditions yet. Add one to control when this field is visible.'}
          </p>
        </div>
      ) : (
        <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
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
