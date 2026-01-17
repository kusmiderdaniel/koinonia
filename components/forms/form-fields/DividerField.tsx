'use client'

import type { FormField } from '../types'

interface DividerFieldProps {
  field: FormField
}

export function DividerField({ field }: DividerFieldProps) {
  const showTitle = field.settings?.divider?.showTitle ?? false

  if (showTitle && field.label) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-8 shrink-0" />
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {field.label}
        </span>
        <div className="h-px bg-zinc-300 dark:bg-zinc-600 flex-1" />
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-full" />
    </div>
  )
}
