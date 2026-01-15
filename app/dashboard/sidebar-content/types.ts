import {
  Home,
  Calendar,
  CheckSquare,
  Users,
  Heart,
  Music,
  FileText,
  Link2,
  Settings,
} from 'lucide-react'
import type { PageKey } from '@/lib/permissions'
import type { LucideIcon } from 'lucide-react'

export interface SidebarUser {
  firstName: string
  lastName: string
  email: string
  role: string
  isSuperAdmin?: boolean
}

export interface SidebarContentProps {
  user: SidebarUser
  churchName: string
  churchLogoUrl?: string | null
  onNavigate?: () => void
  isMobile?: boolean
}

export interface NavItemData {
  href: string
  labelKey: string
  icon: LucideIcon
  pageKey: PageKey
}

export const navItems: NavItemData[] = [
  { href: '/dashboard', labelKey: 'home', icon: Home, pageKey: 'dashboard' },
  { href: '/dashboard/events', labelKey: 'events', icon: Calendar, pageKey: 'events' },
  { href: '/dashboard/tasks', labelKey: 'tasks', icon: CheckSquare, pageKey: 'tasks' },
  { href: '/dashboard/people', labelKey: 'people', icon: Users, pageKey: 'people' },
  { href: '/dashboard/ministries', labelKey: 'ministries', icon: Heart, pageKey: 'ministries' },
  { href: '/dashboard/songs', labelKey: 'songs', icon: Music, pageKey: 'songs' },
  { href: '/dashboard/forms', labelKey: 'forms', icon: FileText, pageKey: 'forms' },
  { href: '/dashboard/links', labelKey: 'links', icon: Link2, pageKey: 'links' },
]

export const adminNavItems: NavItemData[] = [
  { href: '/dashboard/settings', labelKey: 'settings', icon: Settings, pageKey: 'settings' },
]
