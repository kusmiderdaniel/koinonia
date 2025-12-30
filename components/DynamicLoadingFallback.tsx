'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function DetailPanelSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function CalendarViewSkeleton() {
  return (
    <div className="h-full flex gap-6">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0">
        <DetailPanelSkeleton />
      </div>

      {/* Calendar grid */}
      <div className="flex-1">
        <Card className="h-full p-4">
          <div className="space-y-4">
            {/* Month header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-8 w-full" />
              ))}
              {/* Calendar days */}
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={`day-${i}`} className="h-24 w-full rounded" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function TemplatesTabSkeleton() {
  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      {/* Left panel - template list */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full p-3 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right panel - template detail */}
      <div className="flex-1">
        <DetailPanelSkeleton />
      </div>
    </div>
  )
}
