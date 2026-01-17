'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { MinistryCard } from './MinistryCard'
import type { Ministry } from '../types'

interface MinistriesListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  ministries: Ministry[]
  filteredMinistries: Ministry[]
  selectedMinistryId: string | null
  onSelectMinistry: (ministry: Ministry) => void
  onAddClick?: () => void
  canManage?: boolean
  className?: string
}

export function MinistriesListView({
  searchQuery,
  onSearchChange,
  ministries,
  filteredMinistries,
  selectedMinistryId,
  onSelectMinistry,
  onAddClick,
  canManage,
  className,
}: MinistriesListViewProps) {
  const t = useTranslations('ministries')

  return (
    <div className={`flex flex-col border border-black dark:border-white rounded-lg bg-card overflow-hidden ${className ?? 'w-full md:w-80 md:flex-shrink-0'}`}>
      {/* Search and Add Button */}
      <div className="p-3 border-b border-black/20 dark:border-white/20">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 !border !border-black/20 dark:!border-white/20"
            />
          </div>
          {canManage && onAddClick && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full !border !border-black/20 dark:!border-white/20"
              onClick={onAddClick}
              aria-label={t('addMinistry')}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Ministry List */}
      <div className="flex-1 overflow-y-auto p-2">
        {ministries.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('noMinistries')}
            size="sm"
          />
        ) : filteredMinistries.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('noMinistriesFound')}
            description={t('tryDifferentSearch')}
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {filteredMinistries.map((ministry) => (
              <MinistryCard
                key={ministry.id}
                ministry={ministry}
                isSelected={selectedMinistryId === ministry.id}
                onClick={() => onSelectMinistry(ministry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
