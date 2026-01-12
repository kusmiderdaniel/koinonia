'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Clock, MapPin, Settings, Music, Users } from 'lucide-react'
import { getEventTemplates } from './actions'
import { CreateEventFromTemplateDialog } from './CreateEventFromTemplateDialog'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadge } from '@/components/CampusBadge'
import { formatTime, formatDurationMinutes } from '@/lib/utils/format'

interface Location {
  id: string
  name: string
  address: string | null
}

interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location: Location | null
  campus?: { id: string; name: string; color: string } | null
  default_start_time: string
  default_duration_minutes: number
  agendaItemCount: number
  positionCount: number
  event_template_agenda_items?: Array<{ id: string }>
  event_template_positions?: Array<{ id: string; quantity_needed: number }>
}

interface TemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToTemplates: () => void
}

export function TemplatePicker({
  open,
  onOpenChange,
  onGoToTemplates,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const loadTemplates = async () => {
    setIsLoading(true)
    const result = await getEventTemplates()
    if (result.data) {
      setTemplates(result.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadTemplates()
      setSearchQuery('')
      setSelectedTemplate(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) =>
      template.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [templates, debouncedSearchQuery])

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setCreateDialogOpen(true)
  }

  const handleGoToTemplates = () => {
    onOpenChange(false)
    onGoToTemplates()
  }

  const handleCreateDialogClose = (dialogOpen: boolean) => {
    setCreateDialogOpen(dialogOpen)
    if (!dialogOpen) {
      setSelectedTemplate(null)
      // Don't close the picker - let user select another template if they want
    }
  }

  return (
    <>
      <Dialog open={open && !createDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Create Event from Template
            </DialogTitle>
            <DialogDescription>
              Select a template to create a new event.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-[200px] max-h-[350px]">
            {isLoading ? (
              <p className="text-center py-4 text-muted-foreground">Loading templates...</p>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {templates.length === 0
                    ? 'No templates yet'
                    : 'No templates found'}
                </p>
                {templates.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-full !border !border-black dark:!border-white"
                    onClick={handleGoToTemplates}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Create your first template
                  </Button>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full text-left p-4 rounded-lg border border-black dark:border-white hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <EventTypeBadge type={template.event_type} />
                    {template.campus && (
                      <CampusBadge name={template.campus.name} color={template.campus.color} size="sm" />
                    )}
                  </div>
                  <p className="font-semibold">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(template.default_start_time)}</span>
                      <span>•</span>
                      <span>{formatDurationMinutes(template.default_duration_minutes)}</span>
                    </div>
                    {template.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{template.location.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music className="w-3.5 h-3.5" />
                      <span>{template.agendaItemCount} items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{template.positionCount} positions</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3 border-t">
            <Button
              variant="outline-pill"
              size="sm"
              onClick={handleGoToTemplates}
              className="!border !border-black dark:!border-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Templates
            </Button>
            <Button
              variant="outline-pill"
              className="!border !border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      {selectedTemplate && (
        <CreateEventFromTemplateDialog
          open={createDialogOpen}
          onOpenChange={handleCreateDialogClose}
          template={{
            ...selectedTemplate,
            event_template_agenda_items: selectedTemplate.event_template_agenda_items ||
              Array.from({ length: selectedTemplate.agendaItemCount }, (_, i) => ({ id: `temp-${i}` })),
            event_template_positions: selectedTemplate.event_template_positions ||
              Array.from({ length: selectedTemplate.positionCount }, (_, i) => ({ id: `temp-${i}`, quantity_needed: 1 })),
          }}
        />
      )}
    </>
  )
}
