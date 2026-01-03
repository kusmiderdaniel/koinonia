'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Home, Calendar, CheckSquare, Users, Heart, Music, Settings, User, LogOut, CalendarOff, CalendarSync, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ProgressLink } from '@/components/ProgressLink'
import { InboxNavItem } from '@/components/InboxNavItem'
import { usePrefetchRoutes, useSidebarCollapse } from '@/lib/hooks'
import { hasPageAccess, type PageKey } from '@/lib/permissions'

interface SidebarContentProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
  churchLogoUrl?: string | null
  onNavigate?: () => void
  isMobile?: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home, pageKey: 'dashboard' as PageKey },
  { href: '/dashboard/events', label: 'Events', icon: Calendar, pageKey: 'events' as PageKey },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, pageKey: 'tasks' as PageKey },
  { href: '/dashboard/people', label: 'People', icon: Users, pageKey: 'people' as PageKey },
  { href: '/dashboard/ministries', label: 'Ministries', icon: Heart, pageKey: 'ministries' as PageKey },
  { href: '/dashboard/songs', label: 'Songs', icon: Music, pageKey: 'songs' as PageKey },
]

const adminNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, pageKey: 'settings' as PageKey },
]

export function SidebarContent({ user, churchName, churchLogoUrl, onNavigate, isMobile = false }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { prefetchRoute } = usePrefetchRoutes()
  const { isCollapsed, toggle } = useSidebarCollapse()

  // Mobile sidebar is never collapsed
  const collapsed = isMobile ? false : isCollapsed

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const handleNavClick = () => {
    onNavigate?.()
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const churchInitial = churchName.charAt(0).toUpperCase()

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter(item => hasPageAccess(user.role, item.pageKey))
  const visibleAdminNavItems = adminNavItems.filter(item => hasPageAccess(user.role, item.pageKey))

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
        {/* Logo/Church Name - fixed height so border stays in same position */}
        <div className={cn("border-b h-[72px] flex items-center", collapsed ? "p-3 justify-center" : "p-4")}>
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between gap-3"
          )}>
            {collapsed ? (
              // Collapsed: show logo or initial
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    {churchLogoUrl ? (
                      <img
                        src={churchLogoUrl}
                        alt={`${churchName} logo`}
                        className="w-9 h-9 rounded-md object-contain"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-brand text-brand-foreground flex items-center justify-center font-bold text-lg">
                        {churchInitial}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {churchName}
                </TooltipContent>
              </Tooltip>
            ) : (
              // Expanded: show logo + name
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {churchLogoUrl ? (
                  <img
                    src={churchLogoUrl}
                    alt={`${churchName} logo`}
                    className="w-8 h-8 rounded-md object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {churchInitial}
                  </div>
                )}
                <h1 className="font-semibold text-lg truncate">{churchName}</h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item, index) => {
            const isActive = pathname === item.href
            const linkContent = (
              <ProgressLink
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                onMouseEnter={() => prefetchRoute(item.href)}
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

            // Render nav item with Inbox right after Home (index 0)
            const navElement = collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : linkContent

            // Insert Inbox after Home
            if (index === 0) {
              return (
                <div key={item.href}>
                  {navElement}
                  <InboxNavItem
                    collapsed={collapsed}
                    onNavigate={handleNavClick}
                    onPrefetch={() => prefetchRoute('/dashboard/inbox')}
                  />
                </div>
              )
            }

            return navElement
          })}

          {visibleAdminNavItems.length > 0 && (
            <>
              <div className="border-t my-2" />
              {visibleAdminNavItems.map((item) => {
                const isActive = pathname === item.href
                const linkContent = (
                  <ProgressLink
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    onMouseEnter={() => prefetchRoute(item.href)}
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
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return linkContent
              })}
            </>
          )}
        </nav>

        {/* Collapse Toggle - Desktop only - fixed height so border stays in same position */}
        {!isMobile && (
          <div className={cn("border-t h-[48px] flex items-center", collapsed ? "p-2 justify-center" : "px-4 py-2")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggle}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    collapsed ? "w-full justify-center p-2" : "w-full justify-start gap-2"
                  )}
                >
                  {collapsed ? (
                    <ChevronsRight className="w-4 h-4" />
                  ) : (
                    <>
                      <ChevronsLeft className="w-4 h-4" />
                      <span className="text-xs">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  Expand sidebar
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}

        {/* User Avatar Dropdown - fixed height so border stays in same position */}
        <div className="border-t h-[72px] flex items-center p-2">
          <DropdownMenu>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                      suppressHydrationWarning
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.firstName} {user.lastName}
                </TooltipContent>
              </Tooltip>
            ) : (
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center w-full rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  suppressHydrationWarning
                >
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 text-left min-w-0 pr-2">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
            )}
            <DropdownMenuContent align={collapsed ? "center" : "start"} side={collapsed ? "right" : "top"} className="w-56 bg-white dark:bg-zinc-950">
              <DropdownMenuItem asChild>
                <ProgressLink href="/dashboard/profile" onClick={handleNavClick}>
                  <User />
                  Profile
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ProgressLink href="/dashboard/availability" onClick={handleNavClick}>
                  <CalendarOff />
                  Unavailability
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ProgressLink href="/dashboard/calendar-integration" onClick={handleNavClick}>
                  <CalendarSync />
                  Calendar Integration
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
}
