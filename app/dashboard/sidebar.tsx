'use client'

import { cn } from '@/lib/utils'
import { SidebarContent } from './SidebarContent'
import { useSidebarCollapse } from '@/lib/hooks'

interface SidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
  churchLogoUrl?: string | null
  className?: string
}

export function Sidebar({ user, churchName, churchLogoUrl, className }: SidebarProps) {
  const { isCollapsed } = useSidebarCollapse()

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r bg-white dark:bg-zinc-950 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <SidebarContent user={user} churchName={churchName} churchLogoUrl={churchLogoUrl} />
    </aside>
  )
}
