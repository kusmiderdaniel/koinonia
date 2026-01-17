'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getColumnMinWidth, isPinnedColumn, type PeopleColumnKey } from './columns'

interface SortableColumnHeaderProps {
  columnKey: PeopleColumnKey
  children: React.ReactNode
  width?: number
  onResize?: (key: string, width: number) => void
  className?: string
  // Frozen column props
  isFrozen?: boolean
  leftOffset?: number
  isLastFrozen?: boolean
  // Centering
  centered?: boolean
}

export function SortableColumnHeader({
  columnKey,
  children,
  width,
  onResize,
  className,
  isFrozen = false,
  leftOffset = 0,
  isLastFrozen = false,
  centered = false,
}: SortableColumnHeaderProps) {
  const isPinned = isPinnedColumn(columnKey)
  const [isResizing, setIsResizing] = useState(false)
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(width)
  const headerRef = useRef<HTMLTableCellElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  const minWidth = getColumnMinWidth(columnKey)

  // Sortable hook - disabled for pinned columns
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnKey,
    disabled: isPinned,
  })

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

  // Combine refs
  const combinedRef = useCallback((node: HTMLTableCellElement | null) => {
    headerRef.current = node
    setNodeRef(node)
  }, [setNodeRef])

  // Frozen columns need explicit width to prevent collapse during horizontal scroll
  const frozenWidth = currentWidth || minWidth

  // Style for drag transform and frozen columns
  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // For frozen columns, always set width to prevent collapse
    width: isFrozen ? `${frozenWidth}px` : (currentWidth ? `${currentWidth}px` : undefined),
    minWidth: isFrozen ? `${frozenWidth}px` : undefined,
    maxWidth: isFrozen ? `${frozenWidth}px` : undefined,
    opacity: isDragging ? 0.5 : 1,
    // Frozen column styling
    position: isFrozen ? 'sticky' : isDragging ? 'relative' : undefined,
    left: isFrozen ? `${leftOffset}px` : undefined,
    zIndex: isFrozen ? 20 : isDragging ? 1 : undefined,
  }

  return (
    <TableHead
      ref={combinedRef}
      className={cn(
        'relative group select-none',
        !isPinned && 'cursor-grab',
        isDragging && 'cursor-grabbing bg-muted',
        // Frozen column styling - use solid background to hide scrolling content
        isFrozen && 'bg-white dark:bg-zinc-950',
        isLastFrozen && 'shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]',
        className
      )}
      style={dragStyle}
      {...attributes}
      {...(isPinned ? {} : listeners)}
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
        onClick={(e) => e.stopPropagation()}
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
