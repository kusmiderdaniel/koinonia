'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Trash2, GripVertical, Palette } from 'lucide-react'
import { optionColors } from '@/lib/validations/forms'
import type { SelectOption } from '@/lib/validations/forms'

interface FieldEditorOptionsProps {
  options: SelectOption[] | undefined
  onAddOption: () => void
  onUpdateOption: (index: number, label: string) => void
  onDeleteOption: (index: number) => void
  onUpdateOptionColor: (index: number, color: string | null) => void
}

export function FieldEditorOptions({
  options,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onUpdateOptionColor,
}: FieldEditorOptionsProps) {
  const [openColorPickerIndex, setOpenColorPickerIndex] = useState<
    number | null
  >(null)

  return (
    <div className="space-y-3">
      <Label>Options</Label>
      <div className="space-y-2">
        {options?.map((option, index) => {
          const selectedColor = optionColors.find(
            (c) => c.name === option.color
          )
          return (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
              <Popover
                open={openColorPickerIndex === index}
                onOpenChange={(open) =>
                  setOpenColorPickerIndex(open ? index : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 !border !border-black dark:!border-white"
                  >
                    {selectedColor ? (
                      <div
                        className={`h-4 w-4 rounded-full ${selectedColor.bg}`}
                      />
                    ) : (
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto !p-2 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md"
                  align="start"
                >
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateOptionColor(index, null)
                        setOpenColorPickerIndex(null)
                      }}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                        !option.color
                          ? 'border-black dark:border-white'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </button>
                    {optionColors.slice(1).map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          onUpdateOptionColor(index, color.name)
                          setOpenColorPickerIndex(null)
                        }}
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                          option.color === color.name
                            ? 'border-black dark:border-white'
                            : 'border-transparent'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full ${color.bg}`} />
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={option.label}
                onChange={(e) => onUpdateOption(index, e.target.value)}
                onFocus={(e) => e.target.select()}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
                onClick={() => onDeleteOption(index)}
                disabled={options?.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAddOption}
        className="w-full !border !border-black dark:!border-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Option
      </Button>
    </div>
  )
}
