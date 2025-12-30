import { PeoplePageSkeleton } from '@/components/skeletons'
import { DelayedSkeleton } from '@/components/DelayedSkeleton'

export default function Loading() {
  return (
    <DelayedSkeleton>
      <PeoplePageSkeleton />
    </DelayedSkeleton>
  )
}
