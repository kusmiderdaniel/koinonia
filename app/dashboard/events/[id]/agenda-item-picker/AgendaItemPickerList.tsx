'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils/format'
import type { Preset } from './types'

interface AgendaItemPickerListProps {
  presets: Preset[]
  searchQuery: string
  showCreateOption: boolean
  isLoading: boolean
  isAdding: boolean
  onSearchChange: (value: string) => void
  onSelectPreset: (preset: Preset) => void
  onStartCreateNew: () => void
  onClose: () => void
}

export function AgendaItemPickerList({
  presets,
  searchQuery,
  showCreateOption,
  isLoading,
  isAdding,
  onSearchChange,
  onSelectPreset,
  onStartCreateNew,
  onClose,
}: AgendaItemPickerListProps) {
  const t = useTranslations('events.agendaPicker')
  const tCommon = useTranslations('common.buttons')

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-1 py-2">
        {isLoading ? (
          <p className="text-center py-4 text-muted-foreground">{t('loading')}</p>
        ) : (
          <>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                disabled={isAdding || !preset.ministry_id}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{preset.title}</span>
                  {preset.ministry && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: preset.ministry.color }}
                    >
                      {preset.ministry.name}
                    </span>
                  )}
                  {!preset.ministry_id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {t('noMinistry')}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDuration(preset.duration_seconds)}
                </span>
              </button>
            ))}

            {presets.length === 0 && !showCreateOption && (
              <p className="text-center py-4 text-muted-foreground">
                {t('noItemsFound')}
              </p>
            )}

            {showCreateOption && (
              <button
                onClick={onStartCreateNew}
                disabled={isAdding}
                className="w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>
                  {t('create', { name: searchQuery.trim() })}
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <DialogFooter className="!bg-transparent !border-0 flex justify-between items-center pt-4">
        <Button
          variant="outline-pill"
          className="!border !border-black dark:!border-white"
          asChild
        >
          <Link
            href="/dashboard/settings?tab=presets"
            className="flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            {t('manageItems')}
          </Link>
        </Button>
        <Button
          variant="outline-pill"
          className="!border !border-black dark:!border-white"
          onClick={onClose}
        >
          {tCommon('cancel')}
        </Button>
      </DialogFooter>
    </>
  )
}
