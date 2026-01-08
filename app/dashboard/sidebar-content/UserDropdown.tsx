'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LogOut, CalendarOff, CalendarSync } from 'lucide-react'
import { ProgressLink } from '@/components/ProgressLink'
import type { SidebarUser } from './types'

interface UserDropdownProps {
  user: SidebarUser
  collapsed: boolean
  isMobile?: boolean
  onNavigate?: () => void
  onSignOut: () => void
}

export function UserDropdown({
  user,
  collapsed,
  isMobile = false,
  onNavigate,
  onSignOut,
}: UserDropdownProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  const triggerButton = (
    <button
      className={`flex items-center rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors ${
        collapsed ? 'justify-center' : 'w-full'
      } ${isMobile ? 'min-h-14' : ''}`}
      suppressHydrationWarning
    >
      <div className={`flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-14 h-14' : 'w-12 h-12'}`}>
        <Avatar className={isMobile ? 'h-10 w-10' : 'h-9 w-9'}>
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      {!collapsed && (
        <div className="flex-1 text-left min-w-0 pr-2">
          <p className={`font-medium truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      )}
    </button>
  )

  return (
    <div className={`border-t flex items-center p-2 ${isMobile ? 'h-[80px]' : 'h-[72px]'}`}>
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              {user.firstName} {user.lastName}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent
          align={collapsed ? 'center' : 'start'}
          side={collapsed ? 'right' : 'top'}
          className="w-56 bg-white dark:bg-zinc-950"
        >
          <DropdownMenuItem asChild>
            <ProgressLink href="/dashboard/profile" onClick={onNavigate}>
              <User />
              Profile
            </ProgressLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <ProgressLink href="/dashboard/availability" onClick={onNavigate}>
              <CalendarOff />
              Unavailability
            </ProgressLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <ProgressLink
              href="/dashboard/calendar-integration"
              onClick={onNavigate}
            >
              <CalendarSync />
              Calendar Integration
            </ProgressLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onSignOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
