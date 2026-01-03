import type { Assignment } from './types'

export interface StatusStyles {
  bg: string
  border: string
  iconBg: string
  iconColor: string
  badgeClass: string
}

/**
 * Get status-based styling for assignment cards
 */
export function getStatusStyles(status: Assignment['status']): StatusStyles {
  switch (status) {
    case 'accepted':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-100 dark:bg-green-900',
        iconColor: 'text-green-600 dark:text-green-400',
        badgeClass: 'border-green-500 text-green-600 dark:text-green-400',
      }
    case 'declined':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-red-100 dark:bg-red-900',
        iconColor: 'text-red-600 dark:text-red-400',
        badgeClass: 'border-red-500 text-red-600 dark:text-red-400',
      }
    case 'invited':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        iconBg: 'bg-amber-100 dark:bg-amber-900',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'border-amber-500 text-amber-600 dark:text-amber-400',
      }
    case 'expired':
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        border: 'border-gray-200 dark:border-gray-800',
        iconBg: 'bg-gray-100 dark:bg-gray-900',
        iconColor: 'text-gray-500 dark:text-gray-400',
        badgeClass: 'border-gray-400 text-gray-500 dark:text-gray-400',
      }
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-900',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badgeClass: '',
      }
  }
}
