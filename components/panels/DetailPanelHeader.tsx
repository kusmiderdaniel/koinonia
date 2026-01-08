'use client'

import { ReactNode, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks'

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
  const isMobile = useIsMobile()

  return (
    <div className={cn(isMobile ? 'px-3 pt-2 pb-2' : 'px-6 pt-2 pb-3', 'border-b', className)}>
      <div className={`flex items-start justify-between ${isMobile ? 'gap-2' : 'gap-4'}`}>
        <div className={`flex items-center flex-1 min-w-0 ${isMobile ? 'gap-2' : 'gap-3'}`}>
          {colorIndicator && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorIndicator }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold truncate flex items-center gap-2 flex-wrap ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {title}
              {badges}
            </h2>
            {subtitle && (
              <div className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
                    className={`rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 ${isMobile ? 'h-8 w-8' : ''}`}
                    onClick={onEdit}
                  >
                    <Pencil className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 ${isMobile ? 'h-8 w-8' : ''}`}
                    onClick={onDelete}
                  >
                    <Trash2 className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
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
