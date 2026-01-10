'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================
// Query Keys - Centralized for cache management
// ============================================
export const queryKeys = {
  // Events
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  eventPositions: (eventId: string) => ['events', eventId, 'positions'] as const,
  eventAgenda: (eventId: string) => ['events', eventId, 'agenda'] as const,

  // Songs
  songs: ['songs'] as const,
  song: (id: string) => ['songs', id] as const,

  // Ministries
  ministries: ['ministries'] as const,
  ministry: (id: string) => ['ministries', id] as const,
  ministryMembers: (ministryId: string) => ['ministries', ministryId, 'members'] as const,

  // Matrix (scheduling matrix filters)
  matrixMinistries: ['matrix-ministries'] as const,
  matrixCampuses: ['matrix-campuses'] as const,
  matrixData: ['matrix-data'] as const,

  // Members
  churchMembers: ['churchMembers'] as const,

  // Availability
  availability: ['availability'] as const,

  // Settings
  churchSettings: ['churchSettings'] as const,
  locations: ['locations'] as const,

  // Templates
  templates: ['templates'] as const,
  template: (id: string) => ['templates', id] as const,
}

// ============================================
// Generic Query Hook Factory
// ============================================
interface UseQueryOptions<TData> {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

/**
 * Creates a query hook for fetching data from a server action
 *
 * @example
 * const { data, isLoading, error, refetch } = useServerQuery(
 *   queryKeys.events,
 *   () => getEvents(),
 *   { staleTime: 60000 }
 * )
 */
export function useServerQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<{ data?: TData; error?: string }>,
  options?: UseQueryOptions<TData>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await queryFn()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data as TData
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  })
}

// ============================================
// Generic Mutation Hook Factory
// ============================================
interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  invalidateQueries?: readonly unknown[][]
}

/**
 * Creates a mutation hook for server actions with automatic cache invalidation
 *
 * @example
 * const { mutate, isPending } = useServerMutation(
 *   (data: EventInput) => createEvent(data),
 *   {
 *     invalidateQueries: [queryKeys.events],
 *     onSuccess: () => toast.success('Event created!')
 *   }
 * )
 */
export function useServerMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<{ data?: TData; error?: string; success?: boolean }>,
  options?: UseMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await mutationFn(variables)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data as TData
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
      options?.onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      options?.onError?.(error as Error, variables)
    },
  })
}

// ============================================
// Optimistic Update Helpers
// ============================================

/**
 * Helper for optimistic updates - use in mutation's onMutate
 *
 * @example
 * onMutate: async (newEvent) => {
 *   const { previousData, queryKey } = await optimisticUpdate(
 *     queryClient,
 *     queryKeys.events,
 *     (old) => [...old, newEvent]
 *   )
 *   return { previousData, queryKey }
 * },
 * onError: (err, _, context) => {
 *   queryClient.setQueryData(context.queryKey, context.previousData)
 * }
 */
export async function optimisticUpdate<TData>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  updater: (oldData: TData | undefined) => TData
) {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey })

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<TData>(queryKey)

  // Optimistically update to the new value
  queryClient.setQueryData<TData>(queryKey, updater)

  return { previousData, queryKey }
}

// ============================================
// Cache Invalidation Helpers
// ============================================

/**
 * Hook to get cache invalidation functions
 *
 * @example
 * const { invalidateEvents, invalidateSongs } = useCacheInvalidation()
 * await invalidateEvents() // Refreshes events list
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient()

  return {
    // Invalidate all events
    invalidateEvents: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.events }),

    // Invalidate specific event
    invalidateEvent: (eventId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) }),

    // Invalidate all songs
    invalidateSongs: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.songs }),

    // Invalidate specific song
    invalidateSong: (songId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.song(songId) }),

    // Invalidate all ministries (including matrix filter)
    invalidateMinistries: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ministries })
      queryClient.invalidateQueries({ queryKey: queryKeys.matrixMinistries })
    },

    // Invalidate specific ministry
    invalidateMinistry: (ministryId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.ministry(ministryId) }),

    // Invalidate matrix-specific queries
    invalidateMatrixMinistries: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.matrixMinistries }),

    invalidateMatrixCampuses: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.matrixCampuses }),

    invalidateMatrixData: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.matrixData }),

    // Invalidate church members
    invalidateChurchMembers: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.churchMembers }),

    // Invalidate availability
    invalidateAvailability: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.availability }),

    // Invalidate settings
    invalidateChurchSettings: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.churchSettings }),

    // Invalidate locations
    invalidateLocations: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.locations }),

    // Invalidate templates
    invalidateTemplates: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.templates }),

    // Invalidate all queries (use sparingly)
    invalidateAll: () => queryClient.invalidateQueries(),
  }
}

// ============================================
// Prefetch Helper
// ============================================

/**
 * Hook to prefetch data before it's needed
 *
 * @example
 * const { prefetchEvent } = usePrefetch()
 * onMouseEnter={() => prefetchEvent(eventId)}
 */
export function usePrefetch() {
  const queryClient = useQueryClient()

  return {
    prefetchQuery: <TData>(
      queryKey: readonly unknown[],
      queryFn: () => Promise<{ data?: TData; error?: string }>
    ) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const result = await queryFn()
          if (result.error) throw new Error(result.error)
          return result.data
        },
      }),
  }
}
