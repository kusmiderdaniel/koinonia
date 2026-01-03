'use client'

import { ReactNode, memo } from 'react'
import { Card } from '@/components/ui/card'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { EmptyState } from '@/components/EmptyState'
import { useIsMobile } from '@/lib/hooks'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListDetailLayoutProps {
  /** The list view component */
  listView: ReactNode
  /** The detail view component (shown when an item is selected) */
  detailView: ReactNode
  /** Whether an item is currently selected */
  hasSelection: boolean
  /** Title shown in mobile back header when item is selected */
  selectionTitle?: string
  /** Callback when user navigates back from detail on mobile */
  onClearSelection: () => void
  /** Icon for empty state when no item is selected */
  emptyIcon?: LucideIcon
  /** Title for empty state when no item is selected */
  emptyTitle?: string
  /** Description for empty state when no item is selected */
  emptyDescription?: string
  /** Page header content (title, description, action button) */
  header?: ReactNode
  /** Width of the list panel on desktop (default: 320px / w-80) */
  listWidth?: string
  /** Height calculation for content area (default: calc(100vh-220px)) */
  contentHeight?: string
  /** Additional dialogs/modals to render */
  dialogs?: ReactNode
  /** Custom class name for the outer container */
  className?: string
}

export const ListDetailLayout = memo(function ListDetailLayout({
  listView,
  detailView,
  hasSelection,
  selectionTitle = 'Details',
  onClearSelection,
  emptyIcon,
  emptyTitle = 'Select an item',
  emptyDescription = 'Choose an item from the list to view details',
  header,
  listWidth = 'w-80',
  contentHeight = 'h-[calc(100vh-220px)]',
  dialogs,
  className,
}: ListDetailLayoutProps) {
  const isMobile = useIsMobile()

  // Mobile: Show detail view with back button when item is selected
  if (isMobile && hasSelection) {
    return (
      <div className={cn('h-full p-4', className)}>
        <MobileBackHeader
          title={selectionTitle}
          onBack={onClearSelection}
        />
        {detailView}
        {dialogs}
      </div>
    )
  }

  // Mobile: Show list view only
  if (isMobile) {
    return (
      <div className={cn('h-full p-4', className)}>
        {header && <div className="mb-4">{header}</div>}
        <div className="h-[calc(100vh-200px)]">
          {listView}
        </div>
        {dialogs}
      </div>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className={cn('p-4 md:p-8', className)}>
      {header && <div className="mb-6">{header}</div>}

      <div className={cn('flex flex-col md:flex-row gap-6', contentHeight)}>
        {/* List Panel */}
        <div className={cn('w-full md:flex-shrink-0 h-full', `md:${listWidth}`)}>
          {listView}
        </div>

        {/* Detail Panel */}
        <div className="flex-1 min-w-0 h-full">
          {hasSelection ? (
            detailView
          ) : (
            <Card className="h-full flex items-center justify-center border border-black dark:border-zinc-700">
              <EmptyState
                icon={emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
                size="sm"
              />
            </Card>
          )}
        </div>
      </div>

      {dialogs}
    </div>
  )
})
