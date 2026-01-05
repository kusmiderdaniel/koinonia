import { useCallback } from 'react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import type { SelectOption } from '@/lib/validations/forms'

export function useFieldEditorHandlers() {
  const { fields, selectedFieldId, updateField, selectField } = useFormBuilder()

  const selectedField = selectedFieldId
    ? fields.find((f) => f.id === selectedFieldId)
    : null

  const handleLabelChange = useCallback(
    (label: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { label })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleDescriptionChange = useCallback(
    (description: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { description: description || null })
      }
    },
    [selectedFieldId, updateField]
  )

  const handlePlaceholderChange = useCallback(
    (placeholder: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { placeholder: placeholder || null })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleRequiredChange = useCallback(
    (required: boolean) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { required })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleAddOption = useCallback(() => {
    if (!selectedFieldId || !selectedField) return

    const currentOptions = selectedField.options || []
    const newOption: SelectOption = {
      value: `option${currentOptions.length + 1}`,
      label: `Option ${currentOptions.length + 1}`,
    }
    updateField(selectedFieldId, { options: [...currentOptions, newOption] })
  }, [selectedFieldId, selectedField, updateField])

  const handleUpdateOption = useCallback(
    (index: number, label: string) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = [...selectedField.options]
      newOptions[index] = {
        ...newOptions[index],
        label,
        value: label.toLowerCase().replace(/\s+/g, '_'),
      }
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleDeleteOption = useCallback(
    (index: number) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = selectedField.options.filter((_, i) => i !== index)
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleUpdateOptionColor = useCallback(
    (index: number, color: string | null) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = [...selectedField.options]
      newOptions[index] = {
        ...newOptions[index],
        color,
      }
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleNumberSettingChange = useCallback(
    (
      key: 'format' | 'min' | 'max' | 'decimals',
      value: string | number | null
    ) => {
      if (!selectedFieldId || !selectedField) return

      const currentSettings = selectedField.settings || {}
      const currentNumberSettings = currentSettings.number || {
        format: 'number',
        decimals: 0,
      }

      updateField(selectedFieldId, {
        settings: {
          ...currentSettings,
          number: {
            ...currentNumberSettings,
            [key]: value,
          },
        },
      })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleClose = useCallback(() => {
    selectField(null)
  }, [selectField])

  return {
    selectedField,
    selectedFieldId,
    handleLabelChange,
    handleDescriptionChange,
    handlePlaceholderChange,
    handleRequiredChange,
    handleAddOption,
    handleUpdateOption,
    handleDeleteOption,
    handleUpdateOptionColor,
    handleNumberSettingChange,
    handleClose,
  }
}
