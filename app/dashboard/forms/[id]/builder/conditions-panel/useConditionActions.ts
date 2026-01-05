import { useCallback } from 'react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'

export function useConditionActions() {
  const { fields, selectedFieldId, addCondition } = useFormBuilder()

  const selectedFieldIndex = fields.findIndex((f) => f.id === selectedFieldId)
  const availableSourceFields = fields
    .filter((f, index) => f.id !== selectedFieldId && index < selectedFieldIndex)
    .map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options }))

  const canAddCondition =
    selectedFieldId !== null &&
    selectedFieldIndex > 0 &&
    availableSourceFields.length > 0

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
