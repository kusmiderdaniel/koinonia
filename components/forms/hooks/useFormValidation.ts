import { useCallback } from 'react'
import type { FormField, FormValues, FormErrors } from '../types'

interface UseFormValidationOptions {
  visibleFields: FormField[]
  values: FormValues
  setErrors: (errors: FormErrors) => void
}

export function useFormValidation({
  visibleFields,
  values,
  setErrors,
}: UseFormValidationOptions) {
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}

    for (const field of visibleFields) {
      // Required validation
      if (field.required) {
        const value = values[field.id]
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required'
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Please select at least one option'
        }
      }

      // Email validation
      if (field.type === 'email' && values[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(values[field.id]))) {
          newErrors[field.id] = 'Please enter a valid email address'
        }
      }

      // Number validation
      if (
        field.type === 'number' &&
        values[field.id] !== undefined &&
        values[field.id] !== ''
      ) {
        const numValue = Number(values[field.id])
        if (isNaN(numValue)) {
          newErrors[field.id] = 'Please enter a valid number'
        } else {
          const numberSettings = field.settings?.number
          if (
            numberSettings?.min !== null &&
            numberSettings?.min !== undefined &&
            numValue < numberSettings.min
          ) {
            newErrors[field.id] = `Value must be at least ${numberSettings.min}`
          }
          if (
            numberSettings?.max !== null &&
            numberSettings?.max !== undefined &&
            numValue > numberSettings.max
          ) {
            newErrors[field.id] = `Value must be at most ${numberSettings.max}`
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [visibleFields, values, setErrors])

  return { validateForm }
}
