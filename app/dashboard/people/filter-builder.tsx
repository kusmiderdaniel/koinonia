'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { FilterBuilder, type FilterState } from '@/components/filters'
import { PEOPLE_FILTER_FIELDS, PEOPLE_OPERATORS_BY_TYPE } from './filter-types'
import type { FilterFieldDefinition, OperatorsByType } from '@/lib/filters/filter-types'

interface PeopleFilterBuilderProps {
  filterState: FilterState
  onChange: (filterState: FilterState) => void
}

export function PeopleFilterBuilder({ filterState, onChange }: PeopleFilterBuilderProps) {
  const t = useTranslations('people')
  const tFilter = useTranslations('filter')

  // Translate filter fields
  const translatedFields = useMemo((): FilterFieldDefinition[] => {
    return PEOPLE_FILTER_FIELDS.map((field) => ({
      ...field,
      label: t(`filterFields.${field.id}`),
      options: field.options?.map((opt) => ({
        ...opt,
        label: t(`filterOptions.${field.id}.${opt.value}`),
      })),
    }))
  }, [t])

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
