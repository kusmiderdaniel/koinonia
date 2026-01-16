'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useMobileNav, useMobileHeaderContent } from '@/lib/hooks'

interface MobileHeaderProps {
  churchName: string
  churchLogoUrl?: string | null
}

export function MobileHeader({ churchName, churchLogoUrl }: MobileHeaderProps) {
  const { open } = useMobileNav()
  const { content: headerContent } = useMobileHeaderContent()
  const churchInitial = churchName.charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 md:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={open} className="min-h-11 min-w-11 flex-shrink-0" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </Button>
        {churchLogoUrl ? (
          <Image
            src={churchLogoUrl}
            alt={`${churchName} logo`}
            width={32}
            height={32}
            className="rounded-md object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            {churchInitial}
          </div>
        )}
        <h1 className="font-semibold text-lg truncate">{churchName}</h1>
      </div>
      {headerContent && (
        <div className="flex items-center">
          {headerContent}
        </div>
      )}
    </header>
  )
}
