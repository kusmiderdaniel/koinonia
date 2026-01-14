'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { SortBuilder, type SortState } from '@/components/filters'
import { PEOPLE_SORT_FIELDS } from './sort-types'
import type { SortFieldDefinition, SortFieldIcon } from '@/lib/filters/sort-types'
import type { CustomFieldDefinition } from '@/types/custom-fields'

// Map custom field types to sort field icons
function getIconForCustomFieldType(fieldType: string): SortFieldIcon {
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
      return 'select'
    case 'checkbox':
      return 'boolean'
    default:
      return 'text'
  }
}

interface PeopleSortBuilderProps {
  sortState: SortState
  onChange: (sortState: SortState) => void
  customFields?: CustomFieldDefinition[]
}

export function PeopleSortBuilder({ sortState, onChange, customFields = [] }: PeopleSortBuilderProps) {
  const t = useTranslations('people')

  // Translate sort fields and add custom fields
  const translatedFields = useMemo((): SortFieldDefinition[] => {
    // Translate built-in fields
    const builtInFields = PEOPLE_SORT_FIELDS.map((field) => ({
      ...field,
      label: t(`sortFields.${field.id}`),
    }))

    // Add custom fields
    const customFieldDefs: SortFieldDefinition[] = customFields.map((cf) => ({
      id: `cf_${cf.id}`,
      label: cf.name,
      icon: getIconForCustomFieldType(cf.field_type),
    }))

    return [...builtInFields, ...customFieldDefs]
  }, [t, customFields])

  return (
    <SortBuilder
      sortState={sortState}
      onChange={onChange}
      sortFields={translatedFields}
    />
  )
}

// Re-export for backwards compatibility
export { SortBuilder }
