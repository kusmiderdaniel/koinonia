'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText } from 'lucide-react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadge } from '@/components/CampusBadge'
import { formatTimeString, formatDurationMinutes } from '@/lib/utils/format'
import type { Template, TemplateDetail } from './types'

interface TemplatesListProps {
  templates: Template[]
  filteredTemplates: Template[]
  selectedTemplate: TemplateDetail | null
  searchQuery: string
  isLoading: boolean
  canManage: boolean
  isMobile: boolean
  onSearchChange: (query: string) => void
  onSelectTemplate: (template: Template) => void
  onCreateTemplate: () => void
}

export function TemplatesList({
  templates,
  filteredTemplates,
  selectedTemplate,
  searchQuery,
  isLoading,
  canManage,
  isMobile,
  onSearchChange,
  onSelectTemplate,
  onCreateTemplate,
}: TemplatesListProps) {
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
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 rounded-full"
            onClick={onCreateTemplate}
            title="Create template"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading templates...
          </p>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {templates.length === 0
                ? 'No templates yet'
                : 'No templates found'}
            </p>
            {templates.length === 0 && canManage && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={onCreateTemplate}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first template
              </Button>
            )}
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
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
                <p className="font-medium truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeString(template.default_start_time)} •{' '}
                  {formatDurationMinutes(template.default_duration_minutes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {template.agendaItemCount} items • {template.positionCount}{' '}
                  positions
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
