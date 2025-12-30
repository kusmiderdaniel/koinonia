import { MinistriesPageSkeleton } from '@/components/skeletons/MinistriesPageSkeleton'
import { DelayedSkeleton } from '@/components/DelayedSkeleton'

export default function Loading() {
  return (
    <DelayedSkeleton>
      <MinistriesPageSkeleton />
    </DelayedSkeleton>
  )
}
