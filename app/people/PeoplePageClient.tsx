'use client'

import { useState } from 'react'
import { PeopleDataTable } from './PeopleDataTable'
import { AddColumnDialog } from './AddColumnDialog'
import { useRouter } from 'next/navigation'

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

interface PeoplePageClientProps {
  members: Member[]
  customFields: CustomField[]
  customFieldValues: CustomFieldValue[]
  churchId: string
}

export function PeoplePageClient({
  members,
  customFields,
  customFieldValues,
  churchId,
}: PeoplePageClientProps) {
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const router = useRouter()

  const handleColumnAdded = () => {
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="mt-2 text-gray-600">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddColumnDialogOpen(true)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg className="inline-block mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Column
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <svg className="inline-block mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-8">
        <PeopleDataTable
          members={members}
          customFields={customFields}
          customFieldValues={customFieldValues}
          churchId={churchId}
        />
      </div>

      {/* Add Column Dialog */}
      <AddColumnDialog
        churchId={churchId}
        isOpen={isAddColumnDialogOpen}
        onClose={() => setIsAddColumnDialogOpen(false)}
        onSuccess={handleColumnAdded}
      />
    </>
  )
}
