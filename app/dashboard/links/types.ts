import type { Database } from '@/types/supabase'

// Database row types
export type LinkTreeSettingsRow = Database['public']['Tables']['link_tree_settings']['Row']
export type LinkTreeLinkRow = Database['public']['Tables']['link_tree_links']['Row']
export type LinkTreeClickRow = Database['public']['Tables']['link_tree_clicks']['Row']

// Insert types
export type LinkTreeSettingsInsert = Database['public']['Tables']['link_tree_settings']['Insert']
export type LinkTreeLinkInsert = Database['public']['Tables']['link_tree_links']['Insert']
export type LinkTreeClickInsert = Database['public']['Tables']['link_tree_clicks']['Insert']

// Update types
export type LinkTreeSettingsUpdate = Database['public']['Tables']['link_tree_settings']['Update']
export type LinkTreeLinkUpdate = Database['public']['Tables']['link_tree_links']['Update']

// Visibility levels for links
export type LinkVisibility = 'public' | 'member' | 'volunteer' | 'leader' | 'admin'

// Card styles
export type CardStyle = 'filled' | 'outline' | 'shadow'

// Hover effects
export type HoverEffect = 'none' | 'scale' | 'glow' | 'lift'

// Card sizes
export type CardSize = 'small' | 'medium' | 'large'

// Border radius options
export type BorderRadius = 'rounded-none' | 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-full'

// Social platforms
export type SocialPlatform = 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'tiktok' | 'spotify' | 'website' | 'email'

// Social link structure
export interface SocialLink {
  platform: SocialPlatform
  url: string
}

// Link with click count for analytics
export interface LinkWithStats extends LinkTreeLinkRow {
  click_count?: number
  clicks_today?: number
  clicks_this_week?: number
  clicks_this_month?: number
}

// Analytics summary
export interface AnalyticsSummary {
  total_clicks: number
  clicks_today: number
  clicks_this_week: number
  clicks_this_month: number
  links_stats: LinkWithStats[]
}

// Form types for creating/editing
export interface LinkTreeSettingsForm {
  title: string
  bio: string
  background_color: string
  background_gradient_start: string
  background_gradient_end: string
  card_style: CardStyle
  card_border_radius: BorderRadius
  avatar_url: string
  show_church_name: boolean
  social_links: SocialLink[]
  is_active: boolean
}

export interface LinkTreeLinkForm {
  title: string
  url: string
  description: string
  icon: string
  card_color: string
  text_color: string
  hover_effect: HoverEffect
  visibility: LinkVisibility
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

// Role hierarchy for access control
export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
  guest: 0,
}

export const VISIBILITY_REQUIRED: Record<LinkVisibility, number> = {
  public: 0,
  member: 1,
  volunteer: 2,
  leader: 3,
  admin: 4,
}

// Helper function to check if user can see a link
export function canUserSeeLink(userRole: string | null, linkVisibility: LinkVisibility): boolean {
  const roleLevel = ROLE_HIERARCHY[userRole || 'guest'] ?? 0
  const requiredLevel = VISIBILITY_REQUIRED[linkVisibility]
  return roleLevel >= requiredLevel
}

// Preset colors for links (same as campus/ministry colors)
export const LINK_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

// Background colors for the page
export const BACKGROUND_COLORS = [
  '#FFFFFF', // White
  '#F8FAFC', // Slate 50
  '#F1F5F9', // Slate 100
  '#E2E8F0', // Slate 200
  '#1E293B', // Slate 800
  '#0F172A', // Slate 900
  '#000000', // Black
]

// Visibility labels for UI
export const VISIBILITY_LABELS: Record<LinkVisibility, { label: string; description: string }> = {
  public: { label: 'Public', description: 'Anyone can see this link' },
  member: { label: 'Members', description: 'Logged-in church members' },
  volunteer: { label: 'Volunteers', description: 'Volunteers and above' },
  leader: { label: 'Leaders', description: 'Leaders and above' },
  admin: { label: 'Admins', description: 'Admins and owners only' },
}

// Common icons for link cards
export const COMMON_ICONS = [
  { name: 'Link', label: 'Link' },
  { name: 'Globe', label: 'Website' },
  { name: 'Mail', label: 'Email' },
  { name: 'Phone', label: 'Phone' },
  { name: 'MapPin', label: 'Location' },
  { name: 'Calendar', label: 'Calendar' },
  { name: 'Clock', label: 'Clock' },
  { name: 'Heart', label: 'Heart' },
  { name: 'Star', label: 'Star' },
  { name: 'Gift', label: 'Gift' },
  { name: 'ShoppingCart', label: 'Shop' },
  { name: 'CreditCard', label: 'Donate' },
  { name: 'FileText', label: 'Document' },
  { name: 'Video', label: 'Video' },
  { name: 'Music', label: 'Music' },
  { name: 'Headphones', label: 'Podcast' },
  { name: 'BookOpen', label: 'Bible' },
  { name: 'Users', label: 'Community' },
  { name: 'MessageCircle', label: 'Chat' },
  { name: 'Instagram', label: 'Instagram' },
  { name: 'Facebook', label: 'Facebook' },
  { name: 'Youtube', label: 'YouTube' },
  { name: 'Twitter', label: 'Twitter' },
]

// Card size labels
export const CARD_SIZE_LABELS: Record<CardSize, { label: string; description: string }> = {
  small: { label: 'Small', description: 'Compact card' },
  medium: { label: 'Medium', description: 'Standard card' },
  large: { label: 'Large', description: 'Featured card' },
}

// Hover effect labels
export const HOVER_EFFECT_LABELS: Record<HoverEffect, { label: string; icon: string }> = {
  none: { label: 'None', icon: 'Ban' },
  scale: { label: 'Scale', icon: 'Maximize2' },
  glow: { label: 'Glow', icon: 'Sparkles' },
  lift: { label: 'Lift', icon: 'ArrowUp' },
}
