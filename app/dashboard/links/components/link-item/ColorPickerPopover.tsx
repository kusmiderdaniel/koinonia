'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { LINK_COLORS } from '../../types'

interface ColorPickerPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentColor: string
  onColorChange: (color: string) => void
  showTooltip?: boolean
  triggerClassName?: string
}

export function ColorPickerPopover({
  open,
  onOpenChange,
  currentColor,
  onColorChange,
  showTooltip = false,
  triggerClassName,
}: ColorPickerPopoverProps) {
  const t = useTranslations('links')
  const color = currentColor || '#3B82F6'

  const handleChange = (newColor: string) => {
    onColorChange(newColor)
  }

  const trigger = (
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className={cn('h-8 px-2 gap-1.5', triggerClassName)}>
        <div
          className="h-4 w-4 rounded-full border"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs">{t('linkItem.color.button')}</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{t('linkItem.color.tooltip')}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-auto p-2 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {LINK_COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-all',
                  color === c
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c }}
                onClick={() => handleChange(c)}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t">
            <input
              type="color"
              value={color}
              onChange={(e) => handleChange(e.target.value)}
              className="h-6 w-6 rounded-full cursor-pointer border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
            />
            <Input
              value={color}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  handleChange(val)
                }
              }}
              placeholder="#3B82F6"
              className="h-6 w-20 text-xs px-1.5 font-mono"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
