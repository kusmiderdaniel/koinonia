'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { InlineDateEditor } from '../components/InlineDateEditor'
import {
  InlineTextEditor,
  InlineNumberEditor,
  InlineSelectEditor,
  InlineMultiSelectEditor,
} from './editors'
import type {
  CustomFieldDefinition,
  CustomFieldValueType,
} from '@/types/custom-fields'

interface CustomFieldCellProps {
  field: CustomFieldDefinition
  value: CustomFieldValueType
  memberId: string
  canEdit: boolean
  isUpdating: boolean
  onValueChange: (fieldId: string, value: CustomFieldValueType) => void
}

export function CustomFieldCell({
  field,
  value,
  memberId,
  canEdit,
  isUpdating,
  onValueChange,
}: CustomFieldCellProps) {
  const handleChange = (newValue: CustomFieldValueType) => {
    onValueChange(field.id, newValue)
  }

  switch (field.field_type) {
    case 'text':
      return (
        <InlineTextEditor
          value={(value as string) || null}
          onChange={(v) => handleChange(v)}
          disabled={isUpdating}
          canEdit={canEdit}
          placeholder={field.description || undefined}
        />
      )

    case 'date':
      return (
        <InlineDateEditor
          value={(value as string) || null}
          onChange={(v) => handleChange(v)}
          disabled={isUpdating}
          canEdit={canEdit}
        />
      )

    case 'number':
      return (
        <InlineNumberEditor
          value={(value as number) ?? null}
          onChange={(v) => handleChange(v)}
          settings={field.settings}
          disabled={isUpdating}
          canEdit={canEdit}
        />
      )

    case 'select':
      return (
        <InlineSelectEditor
          value={(value as string) || null}
          onChange={(v) => handleChange(v)}
          options={field.options}
          disabled={isUpdating}
          canEdit={canEdit}
        />
      )

    case 'multiselect':
      return (
        <InlineMultiSelectEditor
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => handleChange(v)}
          options={field.options}
          disabled={isUpdating}
          canEdit={canEdit}
        />
      )

    case 'checkbox':
      return (
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => handleChange(checked as boolean)}
          disabled={!canEdit || isUpdating}
          className={isUpdating ? 'opacity-50' : ''}
        />
      )

    default:
      return <span className="text-muted-foreground">—</span>
  }
}
