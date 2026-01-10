'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Users } from 'lucide-react'
import type { TemplatePositionsSectionProps } from './types'

export const TemplatePositionsSection = memo(function TemplatePositionsSection({
  positions,
  canManage,
  onAddPosition,
  onRemovePosition,
  onUpdateQuantity,
}: TemplatePositionsSectionProps) {
  const t = useTranslations('events.templatesTab')

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center justify-between py-4 min-h-[72px]">
        <div className="flex items-center gap-3">
          {positions.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('positionsCount', { count: positions.length })}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={onAddPosition}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('addPosition')}
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 scrollbar-minimal">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noPositionsDefined')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map((position) => (
              <div
                key={position.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  backgroundColor: position.ministry?.color
                    ? `${position.ministry.color}15`
                    : undefined,
                  borderColor: position.ministry?.color
                    ? `${position.ministry.color}40`
                    : undefined,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{position.title}</span>
                    {position.quantity_needed > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        ×{position.quantity_needed}
                      </Badge>
                    )}
                  </div>
                  {position.ministry && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {position.ministry.name}
                      {position.role && ` • ${position.role.name}`}
                    </div>
                  )}
                  {position.notes && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {position.notes}
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        onUpdateQuantity(position.id, Math.max(1, position.quantity_needed - 1))
                      }
                      disabled={position.quantity_needed <= 1}
                    >
                      <span className="text-lg">−</span>
                    </Button>
                    <span className="w-6 text-center text-sm">{position.quantity_needed}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(position.id, position.quantity_needed + 1)}
                    >
                      <span className="text-lg">+</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => onRemovePosition(position.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
