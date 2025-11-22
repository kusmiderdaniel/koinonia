'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserChurches, switchChurch } from '@/app/actions/church'

interface Church {
  id: string
  name: string
  role: string
}

interface ChurchSwitcherProps {
  currentChurchId?: string | null
  currentChurchName?: string | null
}

export function ChurchSwitcher({ currentChurchId, currentChurchName }: ChurchSwitcherProps) {
  const router = useRouter()
  const [churches, setChurches] = useState<Church[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    loadChurches()
  }, [])

  const loadChurches = async () => {
    setIsLoading(true)
    const { churches: userChurches, error } = await getUserChurches()
    console.log('Loaded churches:', userChurches, 'Error:', error)
    setChurches(userChurches)
    setIsLoading(false)
  }

  const handleSwitch = async (churchId: string) => {
    if (churchId === currentChurchId) return

    setIsSwitching(true)
    const result = await switchChurch(churchId)

    if (result.error) {
      alert(result.error)
      setIsSwitching(false)
      return
    }

    router.refresh()
    setIsSwitching(false)
  }

  // Don't show if user has no churches or only one church
  console.log('ChurchSwitcher render:', { isLoading, churchesCount: churches.length, currentChurchId })

  if (isLoading || churches.length <= 1) {
    console.log('ChurchSwitcher hidden:', { isLoading, churchesLength: churches.length })
    return null
  }

  return (
    <div className="relative">
      <label htmlFor="church-switcher" className="sr-only">
        Switch church
      </label>
      <select
        id="church-switcher"
        value={currentChurchId || ''}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={isSwitching}
        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {churches.map((church) => (
          <option key={church.id} value={church.id}>
            {church.name} {church.role === 'owner' ? '(Owner)' : church.role === 'admin' ? '(Admin)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
