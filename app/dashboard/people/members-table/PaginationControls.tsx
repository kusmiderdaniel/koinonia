'use client'

import { useTranslations } from 'next-intl'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZE } from '@/lib/constants'

interface PaginationControlsProps {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  canGoPrevious: boolean
  canGoNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function PaginationControls({
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  canGoPrevious,
  canGoNext,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const t = useTranslations('people')

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // How many page numbers to show

    if (totalPages <= showPages + 2) {
      // Show all pages if there aren't too many
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      let start = Math.max(2, page - 1)
      let end = Math.min(totalPages - 1, page + 1)

      // Adjust if at the edges
      if (page <= 3) {
        end = 4
      } else if (page >= totalPages - 2) {
        start = totalPages - 3
      }

      // Add ellipsis before if needed
      if (start > 2) {
        pages.push('ellipsis')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis after if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
      {/* Results info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {t('pagination.showing', { start: startIndex, end: endIndex, total: totalItems })}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">{t('pagination.rowsPerPage')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(PAGE_SIZE.SMALL)}>{PAGE_SIZE.SMALL}</SelectItem>
              <SelectItem value={String(PAGE_SIZE.DEFAULT)}>{PAGE_SIZE.DEFAULT}</SelectItem>
              <SelectItem value={String(PAGE_SIZE.LARGE)}>{PAGE_SIZE.LARGE}</SelectItem>
              <SelectItem value={String(PAGE_SIZE.MAX)}>{PAGE_SIZE.MAX}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => canGoPrevious && onPageChange(page - 1)}
                className={!canGoPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNum, idx) => (
              <PaginationItem key={`${pageNum}-${idx}`}>
                {pageNum === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={pageNum === page}
                    onClick={() => onPageChange(pageNum)}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => canGoNext && onPageChange(page + 1)}
                className={!canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
