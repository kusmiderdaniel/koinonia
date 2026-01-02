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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Home, Calendar, Users, Heart, Music, Settings, User, LogOut, CalendarOff, CalendarSync } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationCenter } from '@/components/NotificationCenter'
import { ProgressLink } from '@/components/ProgressLink'
import { usePrefetchRoutes } from '@/lib/hooks'
import { hasPageAccess, type PageKey } from '@/lib/permissions'

interface SidebarContentProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
  onNavigate?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home, pageKey: 'dashboard' as PageKey },
  { href: '/dashboard/events', label: 'Events', icon: Calendar, pageKey: 'events' as PageKey },
  { href: '/dashboard/people', label: 'People', icon: Users, pageKey: 'people' as PageKey },
  { href: '/dashboard/ministries', label: 'Ministries', icon: Heart, pageKey: 'ministries' as PageKey },
  { href: '/dashboard/songs', label: 'Songs', icon: Music, pageKey: 'songs' as PageKey },
]

const adminNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, pageKey: 'settings' as PageKey },
]

export function SidebarContent({ user, churchName, onNavigate }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { prefetchRoute } = usePrefetchRoutes()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const handleNavClick = () => {
    onNavigate?.()
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter(item => hasPageAccess(user.role, item.pageKey))
  const visibleAdminNavItems = adminNavItems.filter(item => hasPageAccess(user.role, item.pageKey))

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Logo/Church Name */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-lg truncate">{churchName}</h1>
          <NotificationCenter />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <ProgressLink
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              onMouseEnter={() => prefetchRoute(item.href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </ProgressLink>
          )
        })}

        {visibleAdminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </span>
            </div>
            {visibleAdminNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <ProgressLink
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand text-brand-foreground'
                      : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </ProgressLink>
              )
            })}
          </>
        )}
      </nav>

      {/* User Avatar Dropdown */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
              suppressHydrationWarning
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-zinc-950">
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
  )
}
