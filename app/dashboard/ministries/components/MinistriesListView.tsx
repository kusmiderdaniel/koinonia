'use client'

import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'
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
  className?: string
}

export function MinistriesListView({
  searchQuery,
  onSearchChange,
  ministries,
  filteredMinistries,
  selectedMinistryId,
  onSelectMinistry,
  className,
}: MinistriesListViewProps) {
  return (
    <div className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card overflow-hidden ${className ?? 'w-full md:w-80 md:flex-shrink-0'}`}>
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ministries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Ministry List */}
      <div className="flex-1 overflow-y-auto p-2">
        {ministries.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No ministries yet"
            size="sm"
          />
        ) : filteredMinistries.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No ministries found"
            description="Try a different search term"
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
