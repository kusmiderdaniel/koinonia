'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { CampusBadge } from '@/components/CampusBadge'
import type { Ministry } from '../types'

interface MinistryCardProps {
  ministry: Ministry
  isSelected: boolean
  onClick: () => void
}

export const MinistryCard = memo(function MinistryCard({ ministry, isSelected, onClick }: MinistryCardProps) {
  const t = useTranslations('ministries')

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors border border-black dark:border-white ${
        isSelected
          ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: ministry.color }}
        />
        <span className="font-medium truncate">{ministry.name}</span>
        {!ministry.is_active && (
          <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>
        )}
        {ministry.campus && (
          <CampusBadge name={ministry.campus.name} color={ministry.campus.color} size="sm" />
        )}
      </div>
      {ministry.leader && (
        <p className="text-xs text-muted-foreground pl-[18px]">
          {ministry.leader.first_name} {ministry.leader.last_name}
        </p>
      )}
    </button>
  )
})
