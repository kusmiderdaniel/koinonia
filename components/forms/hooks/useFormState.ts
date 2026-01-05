import { useState, useCallback } from 'react'
import type { FormValues, FormErrors } from '../types'

export function useFormState() {
  const [values, setValues] = useState<FormValues>({})
  const [errors, setErrors] = useState<FormErrors>({})

  const handleValueChange = useCallback(
    (fieldId: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }))
      // Clear error when user changes value
      setErrors((prev) => {
        if (prev[fieldId]) {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        }
        return prev
      })
    },
    []
  )

  const handleMultiSelectChange = useCallback(
    (fieldId: string, optionValue: string, checked: boolean) => {
      setValues((prev) => {
        const current = (prev[fieldId] as string[]) || []
        if (checked) {
          return { ...prev, [fieldId]: [...current, optionValue] }
        } else {
          return { ...prev, [fieldId]: current.filter((v) => v !== optionValue) }
        }
      })
    },
    []
  )

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    values,
    errors,
    setErrors,
    handleValueChange,
    handleMultiSelectChange,
    clearErrors,
  }
}
