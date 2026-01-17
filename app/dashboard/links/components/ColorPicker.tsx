'use client'

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors: string[]
  showCustomInput?: boolean
}

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
  colors,
  showCustomInput = true,
}: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(!colors.includes(value))

  const isSelected = (color: string) => {
    return value.toLowerCase() === color.toLowerCase()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand',
              isSelected(color)
                ? 'border-black dark:border-zinc-600 ring-2 ring-offset-2 ring-brand'
                : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            onClick={() => {
              onChange(color)
              setShowCustom(false)
            }}
            title={color}
          >
            {isSelected(color) && (
              <Check
                className={cn(
                  'w-4 h-4 mx-auto',
                  isLightColor(color) ? 'text-black' : 'text-white'
                )}
              />
            )}
          </button>
        ))}

        {showCustomInput && (
          <button
            type="button"
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              'bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand',
              showCustom && !colors.includes(value)
                ? 'border-black dark:border-zinc-600 ring-2 ring-offset-2 ring-brand'
                : 'border-transparent'
            )}
            onClick={() => setShowCustom(true)}
            title="Custom color"
          />
        )}
      </div>

      {showCustomInput && showCustom && (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border border-black dark:border-zinc-600"
            style={{ backgroundColor: value }}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="w-32 font-mono text-sm"
          />
        </div>
      )}
    </div>
  )
})

// Helper function to determine if a color is light
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
