'use client'

import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useMobileNav } from '@/lib/hooks'
import { SidebarContent } from './SidebarContent'

interface MobileSidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
  churchLogoUrl?: string | null
}

export function MobileSidebar({ user, churchName, churchLogoUrl }: MobileSidebarProps) {
  const t = useTranslations('dashboard.sidebar')
  const { isOpen, close } = useMobileNav()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="left" className="p-0 w-72 !bg-white dark:!bg-zinc-950" showCloseButton={false}>
        <SheetTitle className="sr-only">{t('navigationMenu')}</SheetTitle>
        <SidebarContent
          user={user}
          churchName={churchName}
          churchLogoUrl={churchLogoUrl}
          onNavigate={close}
          isMobile
        />
      </SheetContent>
    </Sheet>
  )
}
