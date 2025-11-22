'use client'

import { useState } from 'react'
import { createCustomField } from '@/app/actions/people'

interface AddColumnDialogProps {
  churchId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddColumnDialog({ churchId, isOpen, onClose, onSuccess }: AddColumnDialogProps) {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'multiselect'>('text')
  const [options, setOptions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const optionsArray = (fieldType === 'select' || fieldType === 'multiselect')
      ? options.split(',').map(o => o.trim()).filter(Boolean)
      : []

    const result = await createCustomField(churchId, {
      name,
      field_type: fieldType,
      options: optionsArray,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setName('')
      setFieldType('text')
      setOptions('')
      onSuccess()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Custom Column</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Column Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Department, Birthday, Skills"
            />
          </div>

          <div>
            <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700">
              Field Type
            </label>
            <select
              id="fieldType"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
              <option value="multiselect">Multi-select</option>
            </select>
          </div>

          {(fieldType === 'select' || fieldType === 'multiselect') && (
            <div>
              <label htmlFor="options" className="block text-sm font-medium text-gray-700">
                Options (comma-separated)
              </label>
              <input
                type="text"
                id="options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Option 1, Option 2, Option 3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter options separated by commas
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
