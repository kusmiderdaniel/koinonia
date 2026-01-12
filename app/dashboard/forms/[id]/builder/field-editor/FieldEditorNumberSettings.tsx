'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NUMBER_FORMAT_VALUES } from './types'
import { useFieldEditorContext } from './FieldEditorContext'

export function FieldEditorNumberSettings() {
  const t = useTranslations('forms.numberSettings')
  const { selectedField, handleNumberSettingChange } = useFieldEditorContext()

  if (!selectedField) return null

  const settings = selectedField.settings?.number

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <Label className="text-sm font-medium">{t('title')}</Label>

      {/* Format */}
      <div className="space-y-1.5">
        <Label htmlFor="number-format" className="text-xs text-muted-foreground">
          {t('format')}
        </Label>
        <Select
          value={settings?.format || 'number'}
          onValueChange={(value) => handleNumberSettingChange('format', value)}
        >
          <SelectTrigger id="number-format" className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            align="start"
            className="!border !border-black dark:!border-white"
          >
            {NUMBER_FORMAT_VALUES.map((format) => (
              <SelectItem key={format} value={format}>
                {t(`formats.${format}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min/Max */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="number-min" className="text-xs text-muted-foreground">
            {t('min')}
          </Label>
          <Input
            id="number-min"
            type="number"
            value={settings?.min ?? ''}
            onChange={(e) =>
              handleNumberSettingChange(
                'min',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder={t('noMin')}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number-max" className="text-xs text-muted-foreground">
            {t('max')}
          </Label>
          <Input
            id="number-max"
            type="number"
            value={settings?.max ?? ''}
            onChange={(e) =>
              handleNumberSettingChange(
                'max',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder={t('noMax')}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Decimals */}
      <div className="space-y-1.5">
        <Label
          htmlFor="number-decimals"
          className="text-xs text-muted-foreground"
        >
          {t('decimalPlaces')}
        </Label>
        <Input
          id="number-decimals"
          type="number"
          min={0}
          max={10}
          value={settings?.decimals ?? 0}
          onChange={(e) =>
            handleNumberSettingChange('decimals', Number(e.target.value) || 0)
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
