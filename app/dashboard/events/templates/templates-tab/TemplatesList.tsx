'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Copy, Pencil, Trash2 } from 'lucide-react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadge } from '@/components/CampusBadge'
import { formatTime, formatDurationMinutes } from '@/lib/utils/format'
import type { Template, TemplateDetail } from './types'

interface TemplatesListProps {
  templates: Template[]
  filteredTemplates: Template[]
  selectedTemplate: TemplateDetail | null
  searchQuery: string
  isLoading: boolean
  canManage: boolean
  isMobile: boolean
  timeFormat?: '12h' | '24h'
  onSearchChange: (query: string) => void
  onSelectTemplate: (template: Template) => void
  onCreateTemplate: () => void
  onEditTemplate: (template: Template) => void
  onDuplicateTemplate: (template: Template) => void
  onDeleteTemplate: (template: Template) => void
}

export function TemplatesList({
  templates,
  filteredTemplates,
  selectedTemplate,
  searchQuery,
  isLoading,
  canManage,
  isMobile,
  timeFormat,
  onSearchChange,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
}: TemplatesListProps) {
  const t = useTranslations('events.templatesTab')

  return (
    <div
      className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card ${
        isMobile ? 'w-full h-full' : 'w-80 flex-shrink-0'
      }`}
    >
      {/* Search + Add Button */}
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 rounded-full !border !border-black dark:!border-white"
            onClick={onCreateTemplate}
            title={t('createTemplate')}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('loading')}
          </p>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {templates.length === 0
                ? t('noTemplates')
                : t('noTemplatesFound')}
            </p>
            {templates.length === 0 && canManage && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full !border !border-black dark:!border-white"
                onClick={onCreateTemplate}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('createFirst')}
              </Button>
            )}
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id
            return (
              <div
                key={template.id}
                className={`flex rounded-lg border border-black dark:border-white transition-colors ${
                  isSelected
                    ? 'bg-gray-100 dark:bg-zinc-800'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <button
                  onClick={() => onSelectTemplate(template)}
                  className="flex-1 text-left p-3 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <EventTypeBadge type={template.event_type} />
                    {template.campus && (
                      <CampusBadge
                        name={template.campus.name}
                        color={template.campus.color}
                        size="sm"
                      />
                    )}
                  </div>
                  <p className={`truncate ${isSelected ? 'font-medium' : ''}`}>{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(template.default_start_time, timeFormat)} •{' '}
                    {formatDurationMinutes(template.default_duration_minutes)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.agendaItemCount} {t('items')} • {template.positionCount}{' '}
                    {t('positions')}
                  </p>
                </button>
                {canManage && (
                  <div className="flex flex-col justify-center gap-0.5 pr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateTemplate(template)
                      }}
                      title={t('duplicateTitle')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTemplate(template)
                      }}
                      title={t('editTitle')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTemplate(template)
                      }}
                      title={t('deleteTitle')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
