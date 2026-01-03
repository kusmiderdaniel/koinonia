'use client'

import { ReactNode, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailPanelHeaderProps {
  /** Main title text */
  title: string
  /** Optional subtitle or additional info below title */
  subtitle?: ReactNode
  /** Optional color indicator (shown as a dot before title) */
  colorIndicator?: string
  /** Optional badges or elements shown inline with title */
  badges?: ReactNode
  /** Whether to show edit/delete action buttons */
  showActions?: boolean
  /** Whether the user can manage (edit/delete) this item */
  canManage?: boolean
  /** Callback when edit button is clicked */
  onEdit?: () => void
  /** Callback when delete button is clicked */
  onDelete?: () => void
  /** Custom action buttons (replaces default edit/delete) */
  customActions?: ReactNode
  /** Additional content below the title row */
  children?: ReactNode
  /** Additional class name for the container */
  className?: string
}

/**
 * A reusable header component for detail panels.
 * Provides consistent styling for title, badges, and action buttons.
 */
export const DetailPanelHeader = memo(function DetailPanelHeader({
  title,
  subtitle,
  colorIndicator,
  badges,
  showActions = true,
  canManage = false,
  onEdit,
  onDelete,
  customActions,
  children,
  className,
}: DetailPanelHeaderProps) {
  return (
    <div className={cn('px-6 pt-2 pb-3 border-b', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {colorIndicator && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorIndicator }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate flex items-center gap-2 flex-wrap">
              {title}
              {badges}
            </h2>
            {subtitle && (
              <div className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {showActions && canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {customActions ?? (
              <>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={onEdit}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
})
