import { useCallback, useMemo } from 'react'
import type { BuilderField, BuilderCondition } from './types'

interface UsePreviewConditionsOptions {
  fields: BuilderField[]
  conditions: BuilderCondition[]
  values: Record<string, unknown>
}

export function usePreviewConditions({ fields, conditions, values }: UsePreviewConditionsOptions) {
  const evaluateCondition = useCallback((condition: BuilderCondition): boolean => {
    const sourceValue = values[condition.source_field_id]

    switch (condition.operator) {
      case 'equals':
        return sourceValue === condition.value
      case 'not_equals':
        return sourceValue !== condition.value
      case 'contains': {
        if (Array.isArray(sourceValue)) {
          return sourceValue.includes(condition.value || '')
        }
        return String(sourceValue || '').includes(condition.value || '')
      }
      case 'does_not_contain': {
        if (Array.isArray(sourceValue)) {
          return !sourceValue.includes(condition.value || '')
        }
        return !String(sourceValue || '').includes(condition.value || '')
      }
      case 'is_empty':
        if (Array.isArray(sourceValue)) return sourceValue.length === 0
        return !sourceValue || sourceValue === ''
      case 'is_not_empty':
        if (Array.isArray(sourceValue)) return sourceValue.length > 0
        return !!sourceValue && sourceValue !== ''
      case 'is_any_of': {
        const allowedValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return sourceValue.some((v) => allowedValues.includes(v))
        }
        return allowedValues.includes(String(sourceValue || ''))
      }
      case 'is_not_any_of': {
        const disallowedValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return !sourceValue.some((v) => disallowedValues.includes(v))
        }
        return !disallowedValues.includes(String(sourceValue || ''))
      }
      case 'is_every_of': {
        const requiredValues: string[] = condition.value ? JSON.parse(condition.value) : []
        if (Array.isArray(sourceValue)) {
          return requiredValues.every((v) => sourceValue.includes(v))
        }
        return false
      }
      case 'before':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) < new Date(condition.value)
      case 'before_or_equal':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) <= new Date(condition.value)
      case 'after':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) > new Date(condition.value)
      case 'after_or_equal':
        if (!sourceValue || !condition.value) return false
        return new Date(sourceValue as string) >= new Date(condition.value)
      default:
        return true
    }
  }, [values])

  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      const fieldConditions = conditions.filter((c) => c.target_field_id === field.id)
      if (fieldConditions.length === 0) return true

      return fieldConditions.every((c) => {
        const conditionMet = evaluateCondition(c)
        return c.action === 'show' ? conditionMet : !conditionMet
      })
    })
  }, [fields, conditions, evaluateCondition])

  const hiddenFieldCount = fields.length - visibleFields.length

  return {
    visibleFields,
    hiddenFieldCount,
    evaluateCondition,
  }
}
