'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NUMBER_FORMATS } from './types'
import type { NumberFormat } from '@/lib/validations/forms'

interface NumberSettings {
  format?: NumberFormat
  min?: number | null
  max?: number | null
  decimals?: number
}

interface FieldEditorNumberSettingsProps {
  settings: NumberSettings | undefined
  onSettingChange: (
    key: 'format' | 'min' | 'max' | 'decimals',
    value: string | number | null
  ) => void
}

export function FieldEditorNumberSettings({
  settings,
  onSettingChange,
}: FieldEditorNumberSettingsProps) {
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <Label className="text-sm font-medium">Number Settings</Label>

      {/* Format */}
      <div className="space-y-1.5">
        <Label htmlFor="number-format" className="text-xs text-muted-foreground">
          Format
        </Label>
        <Select
          value={settings?.format || 'number'}
          onValueChange={(value) => onSettingChange('format', value)}
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
            {NUMBER_FORMATS.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min/Max */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="number-min" className="text-xs text-muted-foreground">
            Min
          </Label>
          <Input
            id="number-min"
            type="number"
            value={settings?.min ?? ''}
            onChange={(e) =>
              onSettingChange(
                'min',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder="No min"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number-max" className="text-xs text-muted-foreground">
            Max
          </Label>
          <Input
            id="number-max"
            type="number"
            value={settings?.max ?? ''}
            onChange={(e) =>
              onSettingChange(
                'max',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder="No max"
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
          Decimal Places
        </Label>
        <Input
          id="number-decimals"
          type="number"
          min={0}
          max={10}
          value={settings?.decimals ?? 0}
          onChange={(e) =>
            onSettingChange('decimals', Number(e.target.value) || 0)
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
