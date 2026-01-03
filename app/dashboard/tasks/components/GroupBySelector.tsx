'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Layers, Check } from 'lucide-react'

export type GroupByField = 'none' | 'priority' | 'assignee' | 'ministry' | 'campus'

interface GroupBySelectorProps {
  value: GroupByField
  onChange: (value: GroupByField) => void
}

const groupByOptions: { value: GroupByField; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'campus', label: 'Campus' },
]

export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  const currentOption = groupByOptions.find((opt) => opt.value === value)
  const hasGrouping = value !== 'none'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700 ${hasGrouping ? '!border-brand text-brand' : ''}`}
        >
          <Layers className="h-4 w-4" />
          {hasGrouping ? (
            <span className="inline-flex items-center gap-1">
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {currentOption?.label}
              </span>
            </span>
          ) : (
            'Group'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-950">
        {groupByOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{option.label}</span>
            {value === option.value && (
              <Check className="h-4 w-4 text-brand" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
