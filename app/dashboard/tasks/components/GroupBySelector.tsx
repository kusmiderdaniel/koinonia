'use client'

import { useTranslations } from 'next-intl'
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

const groupByValues: GroupByField[] = ['none', 'priority', 'assignee', 'ministry', 'campus']

export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()
  const hasGrouping = value !== 'none'

  const getLabel = (field: GroupByField) => t(`groupBy.${field}`)
  const getShortLabel = (field: GroupByField) => t(`groupBy.${field}Short`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 w-full sm:w-auto justify-center !border !border-black/20 dark:!border-white/20 ${hasGrouping ? '!border-brand text-brand' : ''}`}
        >
          <Layers className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          {hasGrouping ? (
            <span className={`bg-primary text-primary-foreground px-1.5 py-0.5 rounded ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? getShortLabel(value) : getLabel(value)}
            </span>
          ) : (
            <span className={isMobile ? 'text-xs' : ''}>{t('groupBy.group')}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-950">
        {groupByValues.map((field) => (
          <DropdownMenuItem
            key={field}
            onClick={() => onChange(field)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{getLabel(field)}</span>
            {value === field && (
              <Check className="h-4 w-4 text-brand" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
