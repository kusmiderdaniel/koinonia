'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getColumnMinWidth, type PeopleColumnKey } from './columns'

interface ResizableTableHeadProps {
  columnKey: PeopleColumnKey
  children: React.ReactNode
  width?: number
  onResize?: (key: string, width: number) => void
  className?: string
  isPinned?: boolean
  centered?: boolean
}

export function ResizableTableHead({
  columnKey,
  children,
  width,
  onResize,
  className,
  isPinned = false,
  centered = false,
}: ResizableTableHeadProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(width)
  const headerRef = useRef<HTMLTableCellElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  const minWidth = getColumnMinWidth(columnKey)

  // Update currentWidth when prop changes
  useEffect(() => {
    setCurrentWidth(width)
  }, [width])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!headerRef.current) return

    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = headerRef.current.offsetWidth
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const diff = e.clientX - startXRef.current
    const newWidth = Math.max(minWidth, startWidthRef.current + diff)
    setCurrentWidth(newWidth)
  }, [isResizing, minWidth])

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return

    setIsResizing(false)
    if (currentWidth && onResize) {
      onResize(columnKey, currentWidth)
    }
  }, [isResizing, currentWidth, columnKey, onResize])

  // Add global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <TableHead
      ref={headerRef}
      className={cn('relative group', className)}
      style={{ width: currentWidth ? `${currentWidth}px` : undefined }}
    >
      <div className={cn('flex items-center', centered ? 'justify-center' : 'pr-3')}>
        {children}
      </div>
      {/* Resize handle */}
      <div
        className={cn(
          'absolute top-0 right-0 w-2 h-full cursor-col-resize',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-primary/20',
          isResizing && 'opacity-100 bg-primary/30'
        )}
        onMouseDown={handleMouseDown}
      >
        <div className={cn(
          'absolute right-0 top-0 w-0.5 h-full bg-border',
          'group-hover:bg-primary',
          isResizing && 'bg-primary'
        )} />
      </div>
    </TableHead>
  )
}
