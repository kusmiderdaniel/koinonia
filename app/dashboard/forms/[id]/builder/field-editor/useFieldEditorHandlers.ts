import { useCallback } from 'react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import type { SelectOption, TranslatedString, SelectOptionI18n } from '@/lib/validations/forms'
import type { Locale } from '@/lib/i18n/config'

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
    const optionLabel = `Option ${currentOptions.length + 1}`
    const newOption: SelectOption = {
      value: optionLabel,
      label: optionLabel,
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
        value: label,
      }
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleDeleteOption = useCallback(
    (index: number) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = selectedField.options.filter((_: unknown, i: number) => i !== index)
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

  const handleDividerSettingChange = useCallback(
    (key: 'showTitle', value: boolean) => {
      if (!selectedFieldId || !selectedField) return

      const currentSettings = selectedField.settings || {}
      const currentDividerSettings = currentSettings.divider || {
        showTitle: false,
      }

      updateField(selectedFieldId, {
        settings: {
          ...currentSettings,
          divider: {
            ...currentDividerSettings,
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

  // I18n handlers for multilingual forms
  const handleLabelI18nChange = useCallback(
    (locale: Locale, value: string) => {
      if (!selectedFieldId || !selectedField) return

      const currentI18n = selectedField.label_i18n || { en: selectedField.label || '' }
      const newI18n: TranslatedString = {
        ...currentI18n,
        [locale]: value,
      }

      // Also update the main label field when editing English (default locale)
      const updates: { label_i18n: TranslatedString; label?: string } = { label_i18n: newI18n }
      if (locale === 'en') {
        updates.label = value
      }

      updateField(selectedFieldId, updates)
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleDescriptionI18nChange = useCallback(
    (locale: Locale, value: string) => {
      if (!selectedFieldId || !selectedField) return

      const currentI18n = selectedField.description_i18n || { en: selectedField.description || '' }
      const newI18n: TranslatedString = {
        ...currentI18n,
        [locale]: value || undefined,
      }

      // Also update the main description field when editing English
      const updates: { description_i18n: TranslatedString; description?: string | null } = { description_i18n: newI18n }
      if (locale === 'en') {
        updates.description = value || null
      }

      updateField(selectedFieldId, updates)
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handlePlaceholderI18nChange = useCallback(
    (locale: Locale, value: string) => {
      if (!selectedFieldId || !selectedField) return

      const currentI18n = selectedField.placeholder_i18n || { en: selectedField.placeholder || '' }
      const newI18n: TranslatedString = {
        ...currentI18n,
        [locale]: value || undefined,
      }

      // Also update the main placeholder field when editing English
      const updates: { placeholder_i18n: TranslatedString; placeholder?: string | null } = { placeholder_i18n: newI18n }
      if (locale === 'en') {
        updates.placeholder = value || null
      }

      updateField(selectedFieldId, updates)
    },
    [selectedFieldId, selectedField, updateField]
  )

  // I18n handler for options
  const handleUpdateOptionI18n = useCallback(
    (index: number, locale: Locale, label: string) => {
      if (!selectedFieldId || !selectedField?.options) return

      // Build options_i18n array that matches the current options array length
      // This handles the case where new options were added after options_i18n was initialized
      const newOptionsI18n: SelectOptionI18n[] = selectedField.options.map((opt, i) => {
        const existingI18n = selectedField.options_i18n?.[i]
        return existingI18n || {
          value: opt.value,
          label: { en: opt.label },
          color: opt.color,
        }
      })

      // Update the specific option's label
      newOptionsI18n[index] = {
        ...newOptionsI18n[index],
        label: {
          ...newOptionsI18n[index].label,
          [locale]: label,
        },
      }

      // Also update the main options when editing English
      const updates: { options_i18n: SelectOptionI18n[]; options?: SelectOption[] } = { options_i18n: newOptionsI18n }
      if (locale === 'en') {
        const newOptions = [...selectedField.options]
        newOptions[index] = {
          ...newOptions[index],
          label,
          value: label,
        }
        updates.options = newOptions
      }

      updateField(selectedFieldId, updates)
    },
    [selectedFieldId, selectedField, updateField]
  )

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
    handleDividerSettingChange,
    handleClose,
    // I18n handlers
    handleLabelI18nChange,
    handleDescriptionI18nChange,
    handlePlaceholderI18nChange,
    handleUpdateOptionI18n,
  }
}
