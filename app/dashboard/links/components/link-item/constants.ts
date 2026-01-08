import {
  Link,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Star,
  Gift,
  ShoppingCart,
  CreditCard,
  FileText,
  Video,
  Music,
  Headphones,
  BookOpen,
  Users,
  MessageCircle,
  RectangleHorizontal,
  Square,
  RectangleVertical,
  Ban,
  Maximize2,
  Sparkles,
  ArrowUp,
  type LucideIcon,
} from 'lucide-react'
import type { CardSize, HoverEffect } from '../../types'

// Icon mapping for dynamic icon rendering
export const ICON_MAP: Record<string, LucideIcon> = {
  Link,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Star,
  Gift,
  ShoppingCart,
  CreditCard,
  FileText,
  Video,
  Music,
  Headphones,
  BookOpen,
  Users,
  MessageCircle,
}

// Size icons
export const SIZE_ICONS: Record<CardSize, LucideIcon> = {
  small: RectangleHorizontal,
  medium: Square,
  large: RectangleVertical,
}

// Hover effect icons
export const HOVER_ICONS: Record<HoverEffect, LucideIcon> = {
  none: Ban,
  scale: Maximize2,
  glow: Sparkles,
  lift: ArrowUp,
}

// Re-export the Link icon as DefaultIcon for use when no icon is set
export const DefaultIcon = Link
