import { SongsPageSkeleton } from '@/components/skeletons/SongsPageSkeleton'
import { DelayedSkeleton } from '@/components/DelayedSkeleton'

export default function Loading() {
  return (
    <DelayedSkeleton>
      <SongsPageSkeleton />
    </DelayedSkeleton>
  )
}
