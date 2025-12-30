'use client'

import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useMobileNav } from '@/lib/hooks'

interface MobileHeaderProps {
  churchName: string
}

export function MobileHeader({ churchName }: MobileHeaderProps) {
  const { open } = useMobileNav()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={open} className="min-h-11 min-w-11">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg truncate">{churchName}</h1>
      </div>
      <NotificationCenter />
    </header>
  )
}
