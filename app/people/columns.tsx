'use client'

import { ColumnDef } from '@tanstack/react-table'
import { EditableCell } from './editable-cell'
import { RoleCell } from './role-cell'

export interface Member {
  id: string
  user_id: string
  role: string
  email: string | null
  phone: string | null
  full_name: string | null
  notes: string | null
  joined_at: string
}

export interface CustomField {
  id: string
  church_id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  options: string[]
  position: number
}

export interface CustomFieldValue {
  id: string
  church_member_id: string
  custom_field_id: string
  value_text: string | null
  value_number: number | null
  value_date: string | null
  value_select: string | null
  value_multiselect: string[] | null
}

export function createColumns(
  customFields: CustomField[],
  customFieldValues: CustomFieldValue[],
  onUpdateMemberInfo: (memberId: string, field: string, value: string) => Promise<void>,
  onUpdateRole: (memberId: string, role: string) => Promise<void>,
  onUpdateCustomField: (
    memberId: string,
    fieldId: string,
    fieldType: string,
    value: any
  ) => Promise<void>
): ColumnDef<Member>[] {
  const getCustomFieldValue = (
    memberId: string,
    fieldId: string,
    fieldType: string
  ) => {
    const valueRecord = customFieldValues.find(
      (v) => v.church_member_id === memberId && v.custom_field_id === fieldId
    )
    if (!valueRecord) return ''

    switch (fieldType) {
      case 'text':
        return valueRecord.value_text || ''
      case 'number':
        return valueRecord.value_number?.toString() || ''
      case 'date':
        return valueRecord.value_date || ''
      case 'select':
        return valueRecord.value_select || ''
      case 'multiselect':
        return valueRecord.value_multiselect || []
      default:
        return ''
    }
  }

  const baseColumns: ColumnDef<Member>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.original.full_name || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.email || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.phone || '-'}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <RoleCell
          value={row.original.role}
          onSave={(value) => onUpdateRole(row.original.id, value)}
        />
      ),
    },
    {
      accessorKey: 'joined_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.joined_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
      ),
    },
  ]

  // Add custom field columns
  const customColumns: ColumnDef<Member>[] = customFields.map((field) => ({
    id: `custom_${field.id}`,
    accessorFn: (row) => getCustomFieldValue(row.id, field.id, field.field_type),
    header: field.name,
    cell: ({ row }) => {
      const value = getCustomFieldValue(row.id, field.id, field.field_type)

      if (field.field_type === 'select' || field.field_type === 'multiselect') {
        return (
          <EditableCell
            value={value as string}
            onSave={(newValue) =>
              onUpdateCustomField(row.id, field.id, field.field_type, newValue)
            }
            type="select"
            options={field.options}
            className="text-gray-600"
          />
        )
      }

      return (
        <EditableCell
          value={value as string}
          onSave={(newValue) =>
            onUpdateCustomField(row.id, field.id, field.field_type, newValue)
          }
          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
          className="text-gray-600"
        />
      )
    },
    enableSorting: false,
  }))

  return [...baseColumns, ...customColumns]
}
