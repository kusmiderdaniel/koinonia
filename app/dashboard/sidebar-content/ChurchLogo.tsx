'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChurchLogoProps {
  churchName: string
  churchLogoUrl?: string | null
  collapsed: boolean
}

export function ChurchLogo({
  churchName,
  churchLogoUrl,
  collapsed,
}: ChurchLogoProps) {
  const churchInitial = churchName.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'border-b h-[72px] flex items-center',
        collapsed ? 'p-3 justify-center' : 'p-4'
      )}
    >
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'justify-center' : 'justify-between gap-3'
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                {churchLogoUrl ? (
                  <Image
                    src={churchLogoUrl}
                    alt={`${churchName} logo`}
                    width={36}
                    height={36}
                    className="rounded-md object-contain"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-brand text-brand-foreground flex items-center justify-center font-bold text-lg">
                    {churchInitial}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{churchName}</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {churchLogoUrl ? (
              <Image
                src={churchLogoUrl}
                alt={`${churchName} logo`}
                width={32}
                height={32}
                className="rounded-md object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                {churchInitial}
              </div>
            )}
            <h1 className="font-semibold text-lg truncate">{churchName}</h1>
          </div>
        )}
      </div>
    </div>
  )
}
