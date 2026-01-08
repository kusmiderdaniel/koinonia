'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Layers, Check } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'

export type GroupByField = 'none' | 'priority' | 'assignee' | 'ministry' | 'campus'

interface GroupBySelectorProps {
  value: GroupByField
  onChange: (value: GroupByField) => void
}

const groupByOptions: { value: GroupByField; label: string; shortLabel: string }[] = [
  { value: 'none', label: 'No grouping', shortLabel: 'None' },
  { value: 'priority', label: 'Priority', shortLabel: 'Pri' },
  { value: 'assignee', label: 'Assignee', shortLabel: 'Asgn' },
  { value: 'ministry', label: 'Ministry', shortLabel: 'Min' },
  { value: 'campus', label: 'Campus', shortLabel: 'Cmp' },
]

export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  const isMobile = useIsMobile()
  const currentOption = groupByOptions.find((opt) => opt.value === value)
  const hasGrouping = value !== 'none'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700 ${hasGrouping ? '!border-brand text-brand' : ''}`}
        >
          <Layers className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          {hasGrouping ? (
            <span className={`bg-primary text-primary-foreground px-1.5 py-0.5 rounded ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? currentOption?.shortLabel : currentOption?.label}
            </span>
          ) : (
            <span className={isMobile ? 'text-xs' : ''}>Group</span>
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
