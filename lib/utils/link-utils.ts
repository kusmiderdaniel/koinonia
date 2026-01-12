import * as LucideIcons from 'lucide-react'

/**
 * Card size style configuration
 */
export interface CardSizeStyle {
  padding: string
  text: string
  icon: string
  height: string
}

/**
 * Card size type (re-exported for convenience, canonical definition in links/types.ts)
 */
export type CardSize = 'small' | 'medium' | 'large'

/**
 * Calculate contrasting text color based on background hex color.
 * Uses luminance formula to determine if text should be light or dark.
 *
 * @param hexColor - Background color in hex format (with or without #)
 * @returns '#1f2937' (dark) for light backgrounds, '#ffffff' (white) for dark backgrounds
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Using relative luminance formula (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}

/**
 * Get a Lucide icon component by name.
 * Supports PascalCase, kebab-case, and snake_case icon names.
 *
 * @param iconName - Name of the Lucide icon (e.g., 'ArrowRight', 'arrow-right', 'arrow_right')
 * @returns The icon component or null if not found
 */
export function getIconComponent(
  iconName: string | null
): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null

  // Convert kebab-case or snake_case to PascalCase
  const pascalCase = iconName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  // @ts-expect-error - Dynamic icon lookup from lucide-react
  const IconComponent = LucideIcons[pascalCase]
  return IconComponent || null
}

/**
 * Card size styles for full-size link cards (public page).
 * Used on the actual link tree public page.
 */
export const CARD_SIZE_STYLES: Record<CardSize, CardSizeStyle> = {
  small: { padding: 'p-3', text: 'text-sm', icon: 'w-4 h-4', height: 'h-16' },
  medium: { padding: 'p-4', text: 'text-base', icon: 'w-5 h-5', height: 'h-20' },
  large: { padding: 'p-5', text: 'text-lg', icon: 'w-6 h-6', height: 'h-28' },
}

/**
 * Card size styles scaled down for preview display.
 * Used in the dashboard preview panel where space is limited.
 */
export const CARD_SIZE_STYLES_PREVIEW: Record<CardSize, CardSizeStyle> = {
  small: { padding: 'px-2.5 py-2', text: 'text-xs', icon: 'w-3 h-3', height: 'h-10' },
  medium: { padding: 'px-3 py-2.5', text: 'text-sm', icon: 'w-4 h-4', height: 'h-12' },
  large: { padding: 'px-4 py-3', text: 'text-base', icon: 'w-5 h-5', height: 'h-16' },
}
