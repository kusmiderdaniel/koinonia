'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

interface CollapseToggleProps {
  collapsed: boolean
  onToggle: () => void
}

export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  return (
    <div
      className={cn(
        'border-t h-[48px] flex items-center',
        collapsed ? 'p-2 justify-center' : 'px-4 py-2'
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'text-muted-foreground hover:text-foreground',
              collapsed
                ? 'w-full justify-center p-2'
                : 'w-full justify-start gap-2'
            )}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronsLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}
