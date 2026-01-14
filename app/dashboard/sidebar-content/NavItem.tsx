'use client'

import { useTranslations } from 'next-intl'
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
  isMobile?: boolean
  onNavigate?: () => void
  onPrefetch?: () => void
}

export function NavItem({
  item,
  isActive,
  collapsed,
  isMobile = false,
  onNavigate,
  onPrefetch,
}: NavItemProps) {
  const t = useTranslations('dashboard.navigation')
  const label = t(item.labelKey)

  const linkContent = (
    <ProgressLink
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      onMouseEnter={onPrefetch}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors',
        isMobile ? 'py-3 min-h-12' : 'py-2',
        isActive
          ? 'bg-brand text-brand-foreground'
          : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-foreground'
      )}
    >
      <div className="w-12 flex items-center justify-center flex-shrink-0">
        <item.icon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
      </div>
      {!collapsed && <span className={cn('pr-3', isMobile && 'text-base')}>{label}</span>}
    </ProgressLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
