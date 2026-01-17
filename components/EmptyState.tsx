'use client'

import { memo, ReactNode } from 'react'
import { LucideIcon, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** Icon to display (from lucide-react) */
  icon?: LucideIcon
  /** Main title/heading */
  title: string
  /** Optional description text */
  description?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
  /** Optional custom content below description */
  children?: ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
}

/**
 * Consistent empty state component for when lists/content are empty.
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   title="No events found"
 *   description="Create your first event to get started."
 * />
 *
 * @example
 * // With icon and action
 * <EmptyState
 *   icon={Calendar}
 *   title="No events found"
 *   description="Create your first event to get started."
 *   action={{ label: "Create Event", onClick: handleCreate }}
 * />
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  children,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-8 w-8',
      title: 'text-sm font-medium',
      description: 'text-xs',
      padding: 'py-6',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-12 w-12',
      title: 'text-base font-medium',
      description: 'text-sm',
      padding: 'py-12',
      gap: 'gap-3',
    },
    lg: {
      icon: 'h-16 w-16',
      title: 'text-lg font-semibold',
      description: 'text-base',
      padding: 'py-16',
      gap: 'gap-4',
    },
  }

  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.padding,
        config.gap,
        className
      )}
    >
      <div className="rounded-full bg-muted p-3">
        <Icon className={cn('text-muted-foreground', config.icon)} />
      </div>
      <div className="space-y-1">
        <p className={cn('text-foreground', config.title)}>{title}</p>
        {description && (
          <p className={cn('text-muted-foreground max-w-sm', config.description)}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          size={size === 'sm' ? 'sm' : 'default'}
          variant={action.variant || 'default'}
          className={action.variant === 'outline' ? '!border !border-black/20 dark:!border-white/20' : ''}
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
})
