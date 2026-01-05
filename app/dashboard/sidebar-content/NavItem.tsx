'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProgressLink } from '@/components/ProgressLink'
import type { NavItemData } from './types'

interface NavItemProps {
  item: NavItemData
  isActive: boolean
  collapsed: boolean
  onNavigate?: () => void
  onPrefetch?: () => void
}

export function NavItem({
  item,
  isActive,
  collapsed,
  onNavigate,
  onPrefetch,
}: NavItemProps) {
  const linkContent = (
    <ProgressLink
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={onPrefetch}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors py-2',
        isActive
          ? 'bg-brand text-brand-foreground'
          : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-foreground'
      )}
    >
      <div className="w-12 flex items-center justify-center flex-shrink-0">
        <item.icon className="w-5 h-5" />
      </div>
      {!collapsed && <span className="pr-3">{item.label}</span>}
    </ProgressLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
