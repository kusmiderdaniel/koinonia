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
import { Home, Calendar, Users, Heart, Music, Settings, User, LogOut, CalendarOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationCenter } from '@/components/NotificationCenter'
import { ProgressLink } from '@/components/ProgressLink'
import { usePrefetchRoutes } from '@/lib/hooks'

interface SidebarProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  churchName: string
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/people', label: 'People', icon: Users },
  { href: '/dashboard/ministries', label: 'Ministries', icon: Heart },
  { href: '/dashboard/songs', label: 'Songs', icon: Music },
]

const adminNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ user, churchName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { prefetchRoute } = usePrefetchRoutes()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white dark:bg-zinc-950 flex flex-col">
      {/* Logo/Church Name */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-lg truncate">{churchName}</h1>
          <NotificationCenter />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <ProgressLink
              key={item.href}
              href={item.href}
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

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <ProgressLink
                  key={item.href}
                  href={item.href}
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
              <ProgressLink href="/dashboard/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </ProgressLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ProgressLink href="/dashboard/availability" className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4" />
                Unavailability
              </ProgressLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
