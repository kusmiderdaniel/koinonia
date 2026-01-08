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
import { COMMON_ICONS } from '../../types'
import { ICON_MAP, DefaultIcon } from './constants'

interface IconPickerPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon: string | null
  onIconChange: (iconName: string | null) => void
  showTooltip?: boolean
  triggerClassName?: string
}

export function IconPickerPopover({
  open,
  onOpenChange,
  currentIcon,
  onIconChange,
  showTooltip = false,
  triggerClassName,
}: IconPickerPopoverProps) {
  const CurrentIconComponent = currentIcon ? ICON_MAP[currentIcon] || DefaultIcon : DefaultIcon

  const trigger = (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-2 gap-1.5',
          currentIcon && 'text-foreground',
          triggerClassName
        )}
      >
        <CurrentIconComponent className="h-4 w-4" />
        <span className="text-xs">Icon</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>Choose icon</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-64 p-3 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Icon</Label>
            {currentIcon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onIconChange(null)}
                className="h-6 px-2 text-xs"
              >
                Remove
              </Button>
            )}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {COMMON_ICONS.map((icon) => {
              const IconComponent = ICON_MAP[icon.name]
              if (!IconComponent) return null
              return (
                <Button
                  key={icon.name}
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    currentIcon === icon.name && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
                    currentIcon !== icon.name && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                  onClick={() => onIconChange(icon.name)}
                  title={icon.label}
                >
                  <IconComponent className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
