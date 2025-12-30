'use client'

import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedListProps<T> {
  items: T[]
  estimateSize: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  emptyMessage?: ReactNode
}

export function VirtualizedList<T>({
  items,
  estimateSize,
  renderItem,
  className = '',
  emptyMessage,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  })

  if (items.length === 0) {
    return <>{emptyMessage}</>
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto ${className}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// A simpler version for lists that may or may not need virtualization
// Only virtualizes when there are more than threshold items
interface SmartVirtualizedListProps<T> {
  items: T[]
  estimateSize: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  emptyMessage?: ReactNode
  virtualizationThreshold?: number
}

export function SmartVirtualizedList<T>({
  items,
  estimateSize,
  renderItem,
  className = '',
  emptyMessage,
  virtualizationThreshold = 50,
}: SmartVirtualizedListProps<T>) {
  // For small lists, render normally without virtualization overhead
  if (items.length <= virtualizationThreshold) {
    if (items.length === 0) {
      return <>{emptyMessage}</>
    }

    return (
      <div className={`overflow-y-auto ${className}`}>
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index}>{renderItem(item, index)}</div>
          ))}
        </div>
      </div>
    )
  }

  // For large lists, use virtualization
  return (
    <VirtualizedList
      items={items}
      estimateSize={estimateSize}
      renderItem={renderItem}
      className={className}
      emptyMessage={emptyMessage}
    />
  )
}
