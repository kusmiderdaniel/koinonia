/**
 * Centralized color constants for the Koinonia application.
 * These colors are used across the codebase for consistency.
 */

// =============================================================================
// BRAND COLOR
// =============================================================================

/**
 * Default brand color used for primary action buttons and highlights.
 * Can be customized per church via database setting.
 */
export const DEFAULT_BRAND_COLOR = '#f49f1e' // Orange

// =============================================================================
// PRESET COLORS (for user selections)
// =============================================================================

/**
 * Preset colors for ministries, tags, and other user-selectable items.
 * These provide a consistent, curated palette for users to choose from.
 */
export const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const

/**
 * Extended preset colors for more variety (campus colors, etc.)
 */
export const EXTENDED_PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#84CC16', // lime
] as const

// =============================================================================
// CHART COLORS
// =============================================================================

/**
 * Default chart colors for data visualization.
 * Brand color first, followed by a complementary palette.
 */
export const CHART_COLORS = [
  '#f49f1e', // brand (orange)
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
] as const

/**
 * Named option colors (for form field options with named colors)
 * Maps color names to hex values.
 */
export const OPTION_COLOR_HEX: Record<string, string> = {
  gray: '#71717a',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
}

/**
 * Colors for grouped/stacked chart elements (e.g., number fields in stacked bars)
 */
export const NUMBER_FIELD_CHART_COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
] as const

// =============================================================================
// LINK TREE COLORS
// =============================================================================

/**
 * Background colors for link tree pages
 */
export const LINK_TREE_BACKGROUND_COLORS = [
  { value: 'bg-white dark:bg-zinc-900', label: 'Default' },
  { value: 'bg-zinc-100 dark:bg-zinc-800', label: 'Light Gray' },
  { value: 'bg-zinc-900 dark:bg-zinc-950', label: 'Dark' },
  { value: 'bg-blue-50 dark:bg-blue-950', label: 'Blue' },
  { value: 'bg-green-50 dark:bg-green-950', label: 'Green' },
  { value: 'bg-purple-50 dark:bg-purple-950', label: 'Purple' },
  { value: 'bg-amber-50 dark:bg-amber-950', label: 'Amber' },
] as const

/**
 * Link button colors for link tree
 */
export const LINK_BUTTON_COLORS = [
  { value: 'default', label: 'Default' },
  { value: 'outline', label: 'Outline' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Red' },
  { value: 'amber', label: 'Amber' },
] as const

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default color for new items when no color is specified
 */
export const DEFAULT_COLOR = '#3B82F6' // blue

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a color from the preset list by index (wraps around if index exceeds length)
 */
export function getPresetColor(index: number): string {
  return PRESET_COLORS[index % PRESET_COLORS.length]
}

/**
 * Get a chart color by index (wraps around if index exceeds length)
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
