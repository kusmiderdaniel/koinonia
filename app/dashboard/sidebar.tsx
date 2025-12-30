'use client'

import { cn } from '@/lib/utils'
import { SidebarContent } from './SidebarContent'

interface SidebarProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
  className?: string
}

export function Sidebar({ user, churchName, className }: SidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white dark:bg-zinc-950 flex flex-col",
      className
    )}>
      <SidebarContent user={user} churchName={churchName} />
    </aside>
  )
}
