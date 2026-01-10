'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
import { Type, EyeOff, Bold, Italic, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LabelStylesPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hideLabel: boolean
  labelBold: boolean
  labelItalic: boolean
  labelUnderline: boolean
  onToggleHideLabel: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  showTooltip?: boolean
}

export function LabelStylesPopover({
  open,
  onOpenChange,
  hideLabel,
  labelBold,
  labelItalic,
  labelUnderline,
  onToggleHideLabel,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  showTooltip = false,
}: LabelStylesPopoverProps) {
  const t = useTranslations('links')
  const hasStyles = hideLabel || labelBold || labelItalic || labelUnderline

  const trigger = (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-2 gap-1.5',
          hasStyles && 'text-foreground'
        )}
      >
        {hideLabel ? <EyeOff className="h-4 w-4" /> : <Type className="h-4 w-4" />}
        <span className="text-xs">{t('linkItem.label.button')}</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{t('linkItem.label.tooltip')}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-auto p-1.5 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              hideLabel && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
              !hideLabel && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            onClick={onToggleHideLabel}
            title={t('linkItem.label.hideLabel')}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-1" />
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              labelBold && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
              !labelBold && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            onClick={onToggleBold}
            title={t('linkItem.label.bold')}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              labelItalic && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
              !labelItalic && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            onClick={onToggleItalic}
            title={t('linkItem.label.italic')}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              labelUnderline && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
              !labelUnderline && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            onClick={onToggleUnderline}
            title={t('linkItem.label.underline')}
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
