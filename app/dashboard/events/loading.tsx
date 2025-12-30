import { EventsPageSkeleton } from '@/components/skeletons/EventsPageSkeleton'
import { DelayedSkeleton } from '@/components/DelayedSkeleton'

export default function Loading() {
  return (
    <DelayedSkeleton>
      <EventsPageSkeleton />
    </DelayedSkeleton>
  )
}
