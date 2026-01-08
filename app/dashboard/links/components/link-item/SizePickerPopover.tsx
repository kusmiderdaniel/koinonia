'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CARD_SIZE_LABELS, type CardSize } from '../../types'
import { SIZE_ICONS } from './constants'

interface SizePickerPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSize: CardSize
  onSizeChange: (size: CardSize) => void
  showTooltip?: boolean
}

export function SizePickerPopover({
  open,
  onOpenChange,
  currentSize,
  onSizeChange,
  showTooltip = false,
}: SizePickerPopoverProps) {
  const SizeIcon = SIZE_ICONS[currentSize]

  const trigger = (
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
        <SizeIcon className="h-4 w-4" />
        <span className="text-xs">Size</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>Card size</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-72 p-3 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium">Card Size</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CARD_SIZE_LABELS) as CardSize[]).map((size) => {
              const Icon = SIZE_ICONS[size]
              return (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9',
                    currentSize === size && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
                    currentSize !== size && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                  onClick={() => onSizeChange(size)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {CARD_SIZE_LABELS[size].label}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
