'use client'

import { useTranslations } from 'next-intl'
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
import { type CardSize } from '../../types'
import { SIZE_ICONS } from './constants'

interface SizePickerPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSize: CardSize
  onSizeChange: (size: CardSize) => void
  showTooltip?: boolean
}

const CARD_SIZES: CardSize[] = ['small', 'medium', 'large']

export function SizePickerPopover({
  open,
  onOpenChange,
  currentSize,
  onSizeChange,
  showTooltip = false,
}: SizePickerPopoverProps) {
  const t = useTranslations('links')
  const SizeIcon = SIZE_ICONS[currentSize]

  const trigger = (
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
        <SizeIcon className="h-4 w-4" />
        <span className="text-xs">{t('linkItem.size.button')}</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{t('linkItem.size.tooltip')}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-72 p-3 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('linkItem.size.label')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {CARD_SIZES.map((size) => {
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
                  {t(`cardSize.${size}.label`)}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
