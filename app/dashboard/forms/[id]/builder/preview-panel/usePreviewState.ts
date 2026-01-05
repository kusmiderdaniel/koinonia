import { useState, useCallback } from 'react'
import type { BuilderField } from './types'

interface UsePreviewStateOptions {
  fields: BuilderField[]
}

export function usePreviewState({ fields }: UsePreviewStateOptions) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleValueChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))

    // Validate number fields
    const field = fields.find(f => f.id === fieldId)
    if (field?.type === 'number' && value !== '' && value !== undefined) {
      const numValue = Number(value)
      const numberSettings = field.settings?.number

      if (!isNaN(numValue)) {
        if (numberSettings?.min !== null && numberSettings?.min !== undefined && numValue < numberSettings.min) {
          setErrors(prev => ({ ...prev, [fieldId]: `Minimum value is ${numberSettings.min}` }))
          return
        }
        if (numberSettings?.max !== null && numberSettings?.max !== undefined && numValue > numberSettings.max) {
          setErrors(prev => ({ ...prev, [fieldId]: `Maximum value is ${numberSettings.max}` }))
          return
        }
      }
    }
    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldId]
      return newErrors
    })
  }, [fields])

  const handleMultiSelectChange = useCallback((fieldId: string, optionValue: string, checked: boolean) => {
    setValues((prev) => {
      const current = (prev[fieldId] as string[]) || []
      if (checked) {
        return { ...prev, [fieldId]: [...current, optionValue] }
      } else {
        return { ...prev, [fieldId]: current.filter((v) => v !== optionValue) }
      }
    })
  }, [])

  const handleReset = useCallback(() => {
    setValues({})
    setErrors({})
  }, [])

  return {
    values,
    errors,
    handleValueChange,
    handleMultiSelectChange,
    handleReset,
  }
}
