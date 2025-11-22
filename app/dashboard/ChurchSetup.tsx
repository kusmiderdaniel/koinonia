'use client'

import { useState } from 'react'
import { CreateChurchForm } from './CreateChurchForm'
import { JoinChurchForm } from './JoinChurchForm'

export function ChurchSetup() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')

  if (mode === 'create') {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setMode('select')}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <CreateChurchForm />
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="mx-auto max-w-md">
        <button
          onClick={() => setMode('select')}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <JoinChurchForm />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Koinonia</h1>
        <p className="mt-2 text-lg text-gray-600">
          To get started, create a new church or join an existing one
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Church Card */}
        <div className="rounded-lg border-2 border-gray-200 bg-white p-8 hover:border-blue-500 transition-colors">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-blue-100 p-4 mb-4">
              <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create a Church</h2>
            <p className="text-gray-600 mb-6">
              Start your own church organization and invite members to join
            </p>
            <button
              onClick={() => setMode('create')}
              className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Church
            </button>
          </div>
        </div>

        {/* Join Church Card */}
        <div className="rounded-lg border-2 border-gray-200 bg-white p-8 hover:border-green-500 transition-colors">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Join a Church</h2>
            <p className="text-gray-600 mb-6">
              Enter an invite code to join an existing church organization
            </p>
            <button
              onClick={() => setMode('join')}
              className="w-full rounded-md bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Join Church
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
