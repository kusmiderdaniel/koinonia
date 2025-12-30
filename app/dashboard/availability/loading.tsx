import { AvailabilityPageSkeleton } from '@/components/skeletons'
import { DelayedSkeleton } from '@/components/DelayedSkeleton'

export default function Loading() {
  return (
    <DelayedSkeleton>
      <AvailabilityPageSkeleton />
    </DelayedSkeleton>
  )
}
