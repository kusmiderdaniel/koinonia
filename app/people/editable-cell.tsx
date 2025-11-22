'use client'

import { useState } from 'react'

interface EditableCellProps {
  value: string
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select'
  options?: string[]
  className?: string
}

export function EditableCell({
  value,
  onSave,
  type = 'text',
  options = [],
  className = '',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (editValue !== value) {
      setIsSaving(true)
      await onSave(editValue)
      setIsSaving(false)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    if (type === 'select') {
      return (
        <select
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            setEditValue(e.target.value)
            onSave(e.target.value)
            setIsEditing(false)
          }}
          onBlur={handleCancel}
          autoFocus
          disabled={isSaving}
          className="min-w-0 max-w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          style={{ width: '100%' }}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        disabled={isSaving}
        className="min-w-0 max-w-full rounded border border-blue-500 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        style={{ width: '100%' }}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer text-sm hover:text-blue-600 ${className}`}
    >
      {value || '-'}
    </div>
  )
}
