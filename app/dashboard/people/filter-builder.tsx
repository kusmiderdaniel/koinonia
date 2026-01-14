'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { FilterBuilder, type FilterState } from '@/components/filters'
import { PEOPLE_FILTER_FIELDS, PEOPLE_OPERATORS_BY_TYPE } from './filter-types'
import type { FilterFieldDefinition, FilterFieldType, OperatorsByType } from '@/lib/filters/filter-types'
import type { CustomFieldDefinition } from '@/types/custom-fields'

// Map custom field types to filter field types
function getFilterTypeForCustomField(fieldType: string): FilterFieldType {
  switch (fieldType) {
    case 'text':
      return 'text'
    case 'number':
      return 'number'
    case 'date':
      return 'date'
    case 'select':
      return 'select'
    case 'multiselect':
      return 'multiSelect'
    case 'checkbox':
      return 'boolean'
    default:
      return 'text'
  }
}

interface PeopleFilterBuilderProps {
  filterState: FilterState
  onChange: (filterState: FilterState) => void
  customFields?: CustomFieldDefinition[]
}

export function PeopleFilterBuilder({ filterState, onChange, customFields = [] }: PeopleFilterBuilderProps) {
  const t = useTranslations('people')
  const tFilter = useTranslations('filter')

  // Translate filter fields and add custom fields
  const translatedFields = useMemo((): FilterFieldDefinition[] => {
    // Translate built-in fields
    const builtInFields = PEOPLE_FILTER_FIELDS.map((field) => ({
      ...field,
      label: t(`filterFields.${field.id}`),
      options: field.options?.map((opt) => ({
        ...opt,
        label: t(`filterOptions.${field.id}.${opt.value}`),
      })),
    }))

    // Add custom fields
    const customFieldDefs: FilterFieldDefinition[] = customFields.map((cf) => ({
      id: `cf_${cf.id}`,
      label: cf.name,
      type: getFilterTypeForCustomField(cf.field_type),
      // For select/multiselect fields, include the options
      options: (cf.field_type === 'select' || cf.field_type === 'multiselect')
        ? cf.options?.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))
        : undefined,
    }))

    return [...builtInFields, ...customFieldDefs]
  }, [t, customFields])

  // Translate operators
  const translatedOperators = useMemo((): OperatorsByType => {
    const result = {} as OperatorsByType
    for (const [type, operators] of Object.entries(PEOPLE_OPERATORS_BY_TYPE)) {
      result[type as keyof OperatorsByType] = operators.map((op) => ({
        ...op,
        label: tFilter(`operators.${op.value}`),
      }))
    }
    return result
  }, [tFilter])

  return (
    <FilterBuilder
      filterState={filterState}
      onChange={onChange}
      filterFields={translatedFields}
      operatorsByType={translatedOperators}
      defaultField="name"
    />
  )
}

// Re-export for backwards compatibility
export { FilterBuilder }
