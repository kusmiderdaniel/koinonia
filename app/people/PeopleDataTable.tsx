'use client'

import { useState } from 'react'
import { updateMemberRole, updateMemberInfo, updateCustomFieldValue } from '@/app/actions/people'

interface Member {
  id: string
  user_id: string
  role: string
  email: string | null
  phone: string | null
  full_name: string | null
  notes: string | null
  joined_at: string
}

interface CustomField {
  id: string
  church_id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  options: string[]
  position: number
}

interface CustomFieldValue {
  id: string
  member_id: string
  field_id: string
  church_id: string
  value: any
}

interface PeopleDataTableProps {
  members: Member[]
  customFields: CustomField[]
  customFieldValues: CustomFieldValue[]
  churchId: string
}

type SortField = 'full_name' | 'email' | 'role' | 'joined_at'
type SortDirection = 'asc' | 'desc'

export function PeopleDataTable({
  members: initialMembers,
  customFields,
  customFieldValues: initialCustomFieldValues,
  churchId
}: PeopleDataTableProps) {
  const [members, setMembers] = useState(initialMembers)
  const [customFieldValues, setCustomFieldValues] = useState(initialCustomFieldValues)
  const [sortField, setSortField] = useState<SortField>('joined_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [editingCell, setEditingCell] = useState<{ memberId: string; field: string } | null>(null)

  const getCustomFieldValue = (memberId: string, fieldId: string) => {
    const value = customFieldValues.find(
      v => v.member_id === memberId && v.field_id === fieldId
    )
    return value?.value || ''
  }

  const handleCustomFieldUpdate = async (memberId: string, fieldId: string, value: any) => {
    const result = await updateCustomFieldValue(memberId, fieldId, churchId, value)
    if (result.error) {
      alert(result.error)
    } else {
      setCustomFieldValues(prev => {
        const existing = prev.find(v => v.member_id === memberId && v.field_id === fieldId)
        if (existing) {
          return prev.map(v =>
            v.member_id === memberId && v.field_id === fieldId
              ? { ...v, value }
              : v
          )
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            member_id: memberId,
            field_id: fieldId,
            church_id: churchId,
            value,
          }]
        }
      })
    }
    setEditingCell(null)
  }

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)

    const sorted = [...members].sort((a, b) => {
      const aVal = a[field] || ''
      const bVal = b[field] || ''

      if (aVal < bVal) return newDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return newDirection === 'asc' ? 1 : -1
      return 0
    })

    setMembers(sorted)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const result = await updateMemberRole(memberId, newRole)
    if (result.error) {
      alert(result.error)
    } else {
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ))
    }
  }

  const handleFieldUpdate = async (memberId: string, field: string, value: string) => {
    const result = await updateMemberInfo(memberId, { [field]: value })
    if (result.error) {
      alert(result.error)
    } else {
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, [field]: value } : m
      ))
    }
    setEditingCell(null)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700'
      case 'admin': return 'bg-blue-100 text-blue-700'
      case 'leader': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="ml-1 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('full_name')}
                  className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-700 hover:text-gray-900"
                >
                  Name
                  <SortIcon field="full_name" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-700 hover:text-gray-900"
                >
                  Email
                  <SortIcon field="email" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-700 hover:text-gray-900"
                >
                  Role
                  <SortIcon field="role" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('joined_at')}
                  className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-700 hover:text-gray-900"
                >
                  Joined
                  <SortIcon field="joined_at" />
                </button>
              </th>
              {customFields.map((field) => (
                <th key={field.id} scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.memberId === member.id && editingCell?.field === 'full_name' ? (
                    <input
                      type="text"
                      defaultValue={member.full_name || ''}
                      autoFocus
                      onBlur={(e) => handleFieldUpdate(member.id, 'full_name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFieldUpdate(member.id, 'full_name', e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ memberId: member.id, field: 'full_name' })}
                      className="cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {member.full_name || 'No name'}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.memberId === member.id && editingCell?.field === 'email' ? (
                    <input
                      type="email"
                      defaultValue={member.email || ''}
                      autoFocus
                      onBlur={(e) => handleFieldUpdate(member.id, 'email', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFieldUpdate(member.id, 'email', e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ memberId: member.id, field: 'email' })}
                      className="cursor-pointer text-sm text-gray-600 hover:text-blue-600"
                    >
                      {member.email || '-'}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.memberId === member.id && editingCell?.field === 'phone' ? (
                    <input
                      type="tel"
                      defaultValue={member.phone || ''}
                      autoFocus
                      onBlur={(e) => handleFieldUpdate(member.id, 'phone', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFieldUpdate(member.id, 'phone', e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ memberId: member.id, field: 'phone' })}
                      className="cursor-pointer text-sm text-gray-600 hover:text-blue-600"
                    >
                      {member.phone || '-'}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(member.role)} cursor-pointer hover:opacity-80`}
                  >
                    <option value="member">Member</option>
                    <option value="leader">Leader</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                {customFields.map((field) => (
                  <td key={field.id} className="whitespace-nowrap px-6 py-4">
                    {editingCell?.memberId === member.id && editingCell?.field === `custom_${field.id}` ? (
                      field.field_type === 'select' || field.field_type === 'multiselect' ? (
                        <select
                          value={getCustomFieldValue(member.id, field.id)}
                          autoFocus
                          onBlur={(e) => handleCustomFieldUpdate(member.id, field.id, e.target.value)}
                          onChange={(e) => handleCustomFieldUpdate(member.id, field.id, e.target.value)}
                          className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          defaultValue={getCustomFieldValue(member.id, field.id)}
                          autoFocus
                          onBlur={(e) => handleCustomFieldUpdate(member.id, field.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCustomFieldUpdate(member.id, field.id, e.currentTarget.value)
                            } else if (e.key === 'Escape') {
                              setEditingCell(null)
                            }
                          }}
                          className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )
                    ) : (
                      <div
                        onClick={() => setEditingCell({ memberId: member.id, field: `custom_${field.id}` })}
                        className="cursor-pointer text-sm text-gray-600 hover:text-blue-600"
                      >
                        {getCustomFieldValue(member.id, field.id) || '-'}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">No members found</p>
        </div>
      )}
    </div>
  )
}
