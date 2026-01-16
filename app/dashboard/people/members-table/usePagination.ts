import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { PAGE_SIZE } from '@/lib/constants'

export interface PaginationState {
  page: number
  pageSize: number
}

export interface UsePaginationOptions {
  defaultPageSize?: number
  useUrlParams?: boolean
}

export interface UsePaginationReturn<T> {
  // Current state
  page: number
  pageSize: number
  totalPages: number
  totalItems: number

  // Paginated data
  paginatedItems: T[]

  // Navigation
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void

  // Helpers
  canGoNext: boolean
  canGoPrevious: boolean
  startIndex: number
  endIndex: number
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { defaultPageSize = PAGE_SIZE.DEFAULT, useUrlParams = true } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial values from URL or defaults
  const initialPage = useUrlParams
    ? parseInt(searchParams.get('page') || '1', 10)
    : 1
  const initialPageSize = useUrlParams
    ? parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10)
    : defaultPageSize

  const [page, setPageState] = useState(Math.max(1, initialPage))

  // Validate page size from URL - must be one of the allowed values
  const validPageSizes = [PAGE_SIZE.SMALL, PAGE_SIZE.DEFAULT, PAGE_SIZE.LARGE, PAGE_SIZE.MAX] as const
  const isValidPageSize = (size: number): size is typeof validPageSizes[number] =>
    validPageSizes.includes(size as typeof validPageSizes[number])

  const [pageSize, setPageSizeState] = useState(
    isValidPageSize(initialPageSize) ? initialPageSize : defaultPageSize
  )

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / pageSize)

  // Ensure current page is valid when items change
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1
    return Math.min(page, totalPages)
  }, [page, totalPages])

  // Update URL with pagination params
  const updateUrl = useCallback((newPage: number, newPageSize: number) => {
    if (!useUrlParams) return

    const params = new URLSearchParams(searchParams.toString())

    if (newPage === 1) {
      params.delete('page')
    } else {
      params.set('page', String(newPage))
    }

    if (newPageSize === defaultPageSize) {
      params.delete('pageSize')
    } else {
      params.set('pageSize', String(newPageSize))
    }

    const queryString = params.toString()
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [useUrlParams, searchParams, router, pathname, defaultPageSize])

  // Set page with URL update
  const setPage = useCallback((newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages))
    setPageState(clampedPage)
    updateUrl(clampedPage, pageSize)
  }, [totalPages, pageSize, updateUrl])

  // Set page size and reset to first page
  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize)
    setPageState(1)
    updateUrl(1, newPageSize)
  }, [updateUrl])

  // Navigation helpers
  const goToFirstPage = useCallback(() => setPage(1), [setPage])
  const goToLastPage = useCallback(() => setPage(totalPages), [setPage, totalPages])
  const goToNextPage = useCallback(() => setPage(validPage + 1), [setPage, validPage])
  const goToPreviousPage = useCallback(() => setPage(validPage - 1), [setPage, validPage])

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize
    return items.slice(startIndex, startIndex + pageSize)
  }, [items, validPage, pageSize])

  // Index helpers
  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1
  const endIndex = Math.min(validPage * pageSize, totalItems)

  return {
    page: validPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext: validPage < totalPages,
    canGoPrevious: validPage > 1,
    startIndex,
    endIndex,
  }
}
