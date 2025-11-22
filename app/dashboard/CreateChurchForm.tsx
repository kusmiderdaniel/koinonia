'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChurch } from '@/app/actions/church'

export function CreateChurchForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createChurch(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.success && result.inviteCode) {
      setInviteCode(result.inviteCode)
      setIsLoading(false)
      // Refresh the page after a delay to show the invite code
      setTimeout(() => {
        router.refresh()
      }, 5000)
    }
  }

  if (inviteCode) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Church Created Successfully!</h2>
          <p className="mt-2 text-gray-600">
            Share this invite code with members to join your church:
          </p>
          <div className="mt-4 inline-block rounded-lg bg-gray-100 px-8 py-4">
            <p className="text-4xl font-mono font-bold text-gray-900 tracking-wider">{inviteCode}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            You can find this code later in your church settings
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Your Church</h2>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the basic information about your church organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Church Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="First Community Church"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="contact@church.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="Springfield"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="IL"
            />
          </div>
        </div>

        <div>
          <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="text"
            id="zip_code"
            name="zip_code"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="62701"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Church'}
          </button>
        </div>
      </form>
    </div>
  )
}
