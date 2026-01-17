'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MemberListItemProps {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  isSelected?: boolean
  isUnavailable?: boolean
  unavailabilityReason?: string | null
  showEmail?: boolean
  disabled?: boolean
  onClick: () => void
}

/**
 * Shared component for rendering a member in a picker list.
 * Handles selected, unavailable, and disabled states.
 */
export function MemberListItem({
  firstName,
  lastName,
  email,
  isSelected = false,
  isUnavailable = false,
  unavailabilityReason,
  showEmail = true,
  disabled = false,
  onClick,
}: MemberListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isUnavailable}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        isUnavailable
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 cursor-not-allowed opacity-75'
          : isSelected
          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
          : 'border-black/20 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-zinc-900'
      )}
    >
      <div className="flex items-center justify-between">
        <div className={isUnavailable ? 'text-red-700 dark:text-red-400' : ''}>
          <div className="font-medium">
            {firstName} {lastName}
          </div>
          {showEmail && email && (
            <div
              className={cn(
                'text-sm',
                isUnavailable ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'
              )}
            >
              {email}
            </div>
          )}
        </div>
        {isUnavailable && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Unavailable</span>
          </div>
        )}
      </div>
      {isUnavailable && unavailabilityReason && (
        <div className="text-xs text-red-600 dark:text-red-500 mt-1 italic">
          {unavailabilityReason}
        </div>
      )}
    </button>
  )
}

export interface UnassignedOptionProps {
  isSelected: boolean
  disabled?: boolean
  onClick: () => void
  label?: string
}

/**
 * Shared component for the "Not assigned" / "Unassigned" option in a picker.
 */
export function UnassignedOption({
  isSelected,
  disabled = false,
  onClick,
  label = 'Not assigned',
}: UnassignedOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        isSelected
          ? 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'
          : 'border-black/20 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-zinc-900'
      )}
    >
      <span className="text-muted-foreground italic">{label}</span>
    </button>
  )
}
