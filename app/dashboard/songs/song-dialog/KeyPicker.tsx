'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { MAJOR_KEYS, MINOR_KEYS } from './types'

interface KeyPickerProps {
  value: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (key: string) => void
}

export function KeyPicker({
  value,
  open,
  onOpenChange,
  onSelect,
}: KeyPickerProps) {
  const t = useTranslations('songs.keyPicker')

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between !border !border-black dark:!border-white"
        >
          {value || <span className="text-muted-foreground">{t('selectKey')}</span>}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-2 bg-white dark:bg-zinc-950 border"
        align="start"
      >
        <div className="text-xs font-semibold text-muted-foreground px-1 py-1">
          {t('major')}
        </div>
        <div className="grid grid-cols-6 gap-1 mb-2">
          {MAJOR_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                value === k
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">
          {t('minor')}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {MINOR_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                value === k
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
