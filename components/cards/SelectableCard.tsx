'use client'

import { ReactNode, memo, forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectableCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Whether the card is currently selected */
  isSelected: boolean
  /** Card content */
  children: ReactNode
  /** Additional class name */
  className?: string
  /** Variant style for the card */
  variant?: 'default' | 'bordered'
}

/**
 * A selectable card component that provides consistent selection styling
 * across list views (Events, Ministries, Songs, etc.)
 */
export const SelectableCard = memo(
  forwardRef<HTMLButtonElement, SelectableCardProps>(function SelectableCard(
    { isSelected, children, className, variant = 'default', ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'w-full text-left p-3 rounded-lg transition-colors',
          variant === 'bordered' && 'border',
          isSelected
            ? cn(
                'bg-gray-100 dark:bg-zinc-800',
                variant === 'bordered' && 'border-brand'
              )
            : cn(
                'hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                variant === 'bordered' && 'border-transparent'
              ),
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  })
)
