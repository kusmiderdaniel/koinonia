'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinChurch } from '@/app/actions/church'

export function JoinChurchForm() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [churchName, setChurchName] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await joinChurch(inviteCode)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.success && result.churchName) {
      setChurchName(result.churchName)
      setIsLoading(false)
      // Refresh the page after a delay
      setTimeout(() => {
        router.refresh()
      }, 2000)
    }
  }

  if (churchName) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome!</h2>
          <p className="mt-2 text-gray-600">
            You have successfully joined <span className="font-semibold">{churchName}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Join a Church</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-character invite code provided by your church administrator
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 text-center mb-2">
            Invite Code
          </label>
          <input
            type="text"
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
            className="block w-full rounded-md border border-gray-300 px-4 py-3 text-center text-2xl font-mono font-bold uppercase text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 tracking-widest"
            placeholder="ABC123"
          />
          <p className="mt-2 text-xs text-gray-500 text-center">
            The code is case-insensitive and consists of letters and numbers
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800 text-center">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading || inviteCode.length !== 6}
            className="w-full rounded-md bg-green-600 px-4 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Join Church'}
          </button>
        </div>
      </form>
    </div>
  )
}
