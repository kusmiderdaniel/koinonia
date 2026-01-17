'use client'

import { useTranslations } from 'next-intl'
import { MUSICAL_KEYS } from './types'

interface KeySelectorProps {
  selectedKey: string | null
  onKeyChange: (key: string) => void
  disabled?: boolean
}

export function KeySelector({
  selectedKey,
  onKeyChange,
  disabled = false,
}: KeySelectorProps) {
  const t = useTranslations('songs.keyPicker')
  const majorKeys = MUSICAL_KEYS.filter((k) => !k.endsWith('m'))
  const minorKeys = MUSICAL_KEYS.filter((k) => k.endsWith('m'))

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('key')}</label>
      <div className="border border-black/20 dark:border-white/20 rounded-lg p-3 bg-gray-50 dark:bg-zinc-900">
        {/* No key option */}
        <button
          type="button"
          onClick={() => onKeyChange('none')}
          disabled={disabled}
          className={`w-full text-left px-2 py-1.5 text-xs rounded mb-2 transition-colors ${
            selectedKey === null
              ? 'bg-purple-500 text-white'
              : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-muted-foreground'
          }`}
        >
          {t('noKey')}
        </button>

        {/* Major keys */}
        <div className="text-xs font-semibold text-muted-foreground px-1 py-1">
          {t('major')}
        </div>
        <div className="grid grid-cols-6 gap-1 mb-2">
          {majorKeys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKeyChange(k)}
              disabled={disabled}
              className={`px-1.5 py-1 text-xs rounded transition-colors ${
                selectedKey === k
                  ? 'bg-purple-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Minor keys */}
        <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t border-black/20 dark:border-white/20 pt-2">
          {t('minor')}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {minorKeys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKeyChange(k)}
              disabled={disabled}
              className={`px-1.5 py-1 text-xs rounded transition-colors ${
                selectedKey === k
                  ? 'bg-purple-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
