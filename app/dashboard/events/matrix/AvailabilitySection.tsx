'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AvailabilitySectionProps {
  unavailability: {
    profileId: string
    firstName: string
    lastName: string
    reason: string | null
  }[]
  multiAssignments: {
    profileId: string
    firstName: string
    lastName: string
    positions: string[]
  }[]
}

export function AvailabilitySection({
  unavailability,
  multiAssignments,
}: AvailabilitySectionProps) {
  const hasContent = unavailability.length > 0 || multiAssignments.length > 0

  if (!hasContent) {
    return (
      <div className="min-h-[60px] p-2 text-xs text-muted-foreground text-center">
        No conflicts
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-[60px] p-2 space-y-1">
        {/* Unavailable people (red) */}
        {unavailability.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unavailability.slice(0, 4).map((person) => (
              <Tooltip key={person.profileId}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-default">
                    {person.firstName}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{person.firstName} {person.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {person.reason || 'Marked as unavailable'}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
            {unavailability.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                +{unavailability.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Multi-assigned people (amber) */}
        {multiAssignments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {multiAssignments.slice(0, 4).map((person) => (
              <Tooltip key={person.profileId}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 cursor-default">
                    {person.firstName}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{person.firstName} {person.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {person.positions.join(', ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
            {multiAssignments.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                +{multiAssignments.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
