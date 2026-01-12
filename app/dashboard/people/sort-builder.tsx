'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { SortBuilder, type SortState } from '@/components/filters'
import { PEOPLE_SORT_FIELDS } from './sort-types'
import type { SortFieldDefinition } from '@/lib/filters/sort-types'

interface PeopleSortBuilderProps {
  sortState: SortState
  onChange: (sortState: SortState) => void
}

export function PeopleSortBuilder({ sortState, onChange }: PeopleSortBuilderProps) {
  const t = useTranslations('people')

  // Translate sort fields
  const translatedFields = useMemo((): SortFieldDefinition[] => {
    return PEOPLE_SORT_FIELDS.map((field) => ({
      ...field,
      label: t(`sortFields.${field.id}`),
    }))
  }, [t])

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
