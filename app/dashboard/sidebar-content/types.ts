import {
  Home,
  Calendar,
  CheckSquare,
  Users,
  Heart,
  Music,
  FileText,
  Settings,
} from 'lucide-react'
import type { PageKey } from '@/lib/permissions'
import type { LucideIcon } from 'lucide-react'

export interface SidebarUser {
  firstName: string
  lastName: string
  email: string
  role: string
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
  label: string
  icon: LucideIcon
  pageKey: PageKey
}

export const navItems: NavItemData[] = [
  { href: '/dashboard', label: 'Home', icon: Home, pageKey: 'dashboard' },
  { href: '/dashboard/events', label: 'Events', icon: Calendar, pageKey: 'events' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, pageKey: 'tasks' },
  { href: '/dashboard/people', label: 'People', icon: Users, pageKey: 'people' },
  { href: '/dashboard/ministries', label: 'Ministries', icon: Heart, pageKey: 'ministries' },
  { href: '/dashboard/songs', label: 'Songs', icon: Music, pageKey: 'songs' },
  { href: '/dashboard/forms', label: 'Forms', icon: FileText, pageKey: 'forms' },
]

export const adminNavItems: NavItemData[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, pageKey: 'settings' },
]
