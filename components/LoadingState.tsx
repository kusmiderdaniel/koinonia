'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** Optional message to display */
  message?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to display inline or as full container */
  inline?: boolean
  /** Additional className */
  className?: string
}

/**
 * Consistent loading state component used across the app.
 *
 * @example
 * // Full page loading
 * <LoadingState message="Loading events..." />
 *
 * @example
 * // Inline loading
 * <LoadingState message="Loading..." size="sm" inline />
 */
export const LoadingState = memo(function LoadingState({
  message = 'Loading...',
  size = 'md',
  inline = false,
  className,
}: LoadingStateProps) {
  const sizeConfig = {
    sm: { icon: 'h-4 w-4', text: 'text-sm', padding: 'py-4' },
    md: { icon: 'h-6 w-6', text: 'text-base', padding: 'py-8' },
    lg: { icon: 'h-8 w-8', text: 'text-lg', padding: 'py-12' },
  }

  const config = sizeConfig[size]

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className={cn('animate-spin', config.icon)} />
        <span className={config.text}>{message}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', config.padding, className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', config.icon)} />
      <p className={cn('mt-2 text-muted-foreground', config.text)}>{message}</p>
    </div>
  )
})
