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
import { type HoverEffect } from '../../types'
import { HOVER_ICONS } from './constants'

interface HoverEffectPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEffect: HoverEffect
  onEffectChange: (effect: HoverEffect) => void
  showTooltip?: boolean
}

const HOVER_EFFECTS: HoverEffect[] = ['none', 'scale', 'glow', 'lift']

export function HoverEffectPopover({
  open,
  onOpenChange,
  currentEffect,
  onEffectChange,
  showTooltip = false,
}: HoverEffectPopoverProps) {
  const t = useTranslations('links')
  const HoverIcon = HOVER_ICONS[currentEffect]

  const trigger = (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-2 gap-1.5',
          currentEffect !== 'none' && 'text-foreground'
        )}
      >
        <HoverIcon className="h-4 w-4" />
        <span className="text-xs">{t('linkItem.hover.button')}</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{t('linkItem.hover.tooltip')}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-48 p-3 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('linkItem.hover.label')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {HOVER_EFFECTS.map((effect) => {
              const Icon = HOVER_ICONS[effect]
              return (
                <Button
                  key={effect}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9',
                    currentEffect === effect && 'bg-zinc-200 dark:bg-zinc-700 border-foreground',
                    currentEffect !== effect && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                  onClick={() => onEffectChange(effect)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {t(`hoverEffect.${effect}`)}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
