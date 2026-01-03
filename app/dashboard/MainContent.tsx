'use client'

import { useSidebarCollapse } from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebarCollapse()

  return (
    <main className={cn(
      "pt-14 md:pt-0 transition-all duration-300",
      isCollapsed ? "md:pl-16" : "md:pl-64"
    )}>
      {children}
    </main>
  )
}
