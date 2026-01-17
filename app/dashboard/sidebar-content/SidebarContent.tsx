'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { InboxNavItem } from '@/components/InboxNavItem'
import { usePrefetchRoutes, useSidebarCollapse } from '@/lib/hooks'
import { hasPageAccess, isMember } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { ChurchLogo } from './ChurchLogo'
import { NavItem } from './NavItem'
import { CollapseToggle } from './CollapseToggle'
import { UserDropdown } from './UserDropdown'
import { navItems, adminNavItems } from './types'
import type { SidebarContentProps } from './types'

export function SidebarContent({
  user,
  churchName,
  churchLogoUrl,
  onNavigate,
  isMobile = false,
}: SidebarContentProps) {
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

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter((item) =>
    hasPageAccess(user.role, item.pageKey)
  )
  const visibleAdminNavItems = adminNavItems.filter((item) =>
    hasPageAccess(user.role, item.pageKey)
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
        <ChurchLogo
          churchName={churchName}
          churchLogoUrl={churchLogoUrl}
          collapsed={collapsed}
        />

        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item, index) => {
            const isActive = pathname === item.href

            // Insert Inbox after Home (index 0), but not for members
            if (index === 0 && !isMember(user.role)) {
              return (
                <div key={item.href}>
                  <NavItem
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    isMobile={isMobile}
                    onNavigate={handleNavClick}
                    onPrefetch={() => prefetchRoute(item.href)}
                  />
                  <InboxNavItem
                    profileId={user.id}
                    collapsed={collapsed}
                    isMobile={isMobile}
                    onNavigate={handleNavClick}
                    onPrefetch={() => prefetchRoute('/dashboard/inbox')}
                  />
                </div>
              )
            }

            return (
              <NavItem
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                isMobile={isMobile}
                onNavigate={handleNavClick}
                onPrefetch={() => prefetchRoute(item.href)}
              />
            )
          })}

          {visibleAdminNavItems.length > 0 && (
            <>
              <div className="border-t border-black dark:border-white my-2" />
              {visibleAdminNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    isMobile={isMobile}
                    onNavigate={handleNavClick}
                    onPrefetch={() => prefetchRoute(item.href)}
                  />
                )
              })}
            </>
          )}
        </nav>

        {/* Super Admin Link */}
        {user.isSuperAdmin && (
          <div className="px-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
                    collapsed && !isMobile && "justify-center px-2"
                  )}
                  onClick={handleNavClick}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  {(!collapsed || isMobile) && <span>Admin Panel</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side="right">Admin Panel</TooltipContent>
              )}
            </Tooltip>
          </div>
        )}

        {!isMobile && <CollapseToggle collapsed={collapsed} onToggle={toggle} />}

        <UserDropdown
          user={user}
          collapsed={collapsed}
          isMobile={isMobile}
          onNavigate={handleNavClick}
          onSignOut={handleSignOut}
        />
      </div>
    </TooltipProvider>
  )
}
