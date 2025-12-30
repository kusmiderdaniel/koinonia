'use client'

import { useState, useEffect, ReactNode } from 'react'

interface DelayedSkeletonProps {
  children: ReactNode
  delay?: number
}

/**
 * Wrapper that delays showing skeleton content.
 * This prevents skeleton flash for fast page loads.
 * The skeleton only appears if loading takes longer than the delay.
 */
export function DelayedSkeleton({ children, delay = 300 }: DelayedSkeletonProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!show) return null

  return <>{children}</>
}
