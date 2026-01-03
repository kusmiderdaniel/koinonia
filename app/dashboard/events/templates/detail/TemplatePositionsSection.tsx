'use client'

import { memo } from 'react'
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
  if (positions.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-3">No positions defined</p>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full !border !border-gray-300 dark:!border-zinc-600"
            onClick={onAddPosition}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Positions
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      {positions.map((position) => (
        <div
          key={position.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
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
      {canManage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full !border !border-gray-300 dark:!border-zinc-600"
            onClick={onAddPosition}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Positions
          </Button>
        </div>
      )}
    </>
  )
})
