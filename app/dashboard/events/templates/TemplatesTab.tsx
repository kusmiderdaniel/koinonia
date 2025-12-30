'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, FileText } from 'lucide-react'
import { getEventTemplates, getEventTemplate, deleteEventTemplate } from './actions'
import { TemplateDialog } from './TemplateDialog'
import { DetailPanelSkeleton } from '@/components/DynamicLoadingFallback'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { useIsMobile } from '@/lib/hooks'
import { formatTimeString, formatDurationMinutes } from '@/lib/utils/format'

// Dynamic import for heavy detail panel
const TemplateDetailPanel = dynamic(
  () => import('./TemplateDetailPanel').then(mod => ({ default: mod.TemplateDetailPanel })),
  { loading: () => <DetailPanelSkeleton />, ssr: false }
)

interface Location {
  id: string
  name: string
  address: string | null
}

interface Person {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
  agendaItemCount: number
  positionCount: number
}

interface TemplateDetail {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
  event_template_agenda_items: Array<{
    id: string
    title: string
    description: string | null
    duration_seconds: number
    is_song_placeholder: boolean
    ministry_id: string | null
    ministry: { id: string; name: string } | null
    sort_order: number
  }>
  event_template_positions: Array<{
    id: string
    ministry_id: string
    role_id: string | null
    title: string
    quantity_needed: number
    notes: string | null
    ministry: { id: string; name: string } | null
    role: { id: string; name: string } | null
    sort_order: number | null
  }>
}

export const TemplatesTab = memo(function TemplatesTab() {
  const isMobile = useIsMobile()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [canDelete, setCanDelete] = useState(false)

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)

  const loadTemplates = async () => {
    setIsLoading(true)
    const result = await getEventTemplates()
    if (result.data) {
      setTemplates(result.data)
      setCanManage(result.canManage || false)
    }
    setIsLoading(false)
  }

  const loadTemplateDetail = async (templateId: string) => {
    const result = await getEventTemplate(templateId)
    if (result.data) {
      setSelectedTemplate(result.data)
      setCanDelete(result.canDelete || false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleSelectTemplate = async (template: Template) => {
    await loadTemplateDetail(template.id)
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateDialogOpen(true)
  }

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      setEditingTemplate(selectedTemplate)
      setTemplateDialogOpen(true)
    }
  }

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return

    const result = await deleteEventTemplate(templateToDelete.id)
    if (!result.error) {
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null)
      }
      await loadTemplates()
    }
  }

  const handleDialogSuccess = async () => {
    setTemplateDialogOpen(false)
    setEditingTemplate(null)
    await loadTemplates()
    // If we were editing, refresh the detail view
    if (editingTemplate && selectedTemplate) {
      await loadTemplateDetail(selectedTemplate.id)
    }
  }

  const handleCloseDetail = () => {
    setSelectedTemplate(null)
  }

  const handleTemplateUpdated = async () => {
    await loadTemplates()
    if (selectedTemplate) {
      await loadTemplateDetail(selectedTemplate.id)
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchQuery) return templates
    const query = debouncedSearchQuery.toLowerCase()
    return templates.filter((template) =>
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    )
  }, [templates, debouncedSearchQuery])

  const templateListContent = (
    <div className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card ${isMobile ? 'w-full h-full' : 'w-80 flex-shrink-0'}`}>
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
                onClick={handleCreateTemplate}
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
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <EventTypeBadge type={template.event_type} />
                </div>
                <p className="font-medium truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeString(template.default_start_time)} • {formatDurationMinutes(template.default_duration_minutes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {template.agendaItemCount} items • {template.positionCount} positions
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  const detailContent = selectedTemplate ? (
    <TemplateDetailPanel
      template={selectedTemplate}
      canManage={canManage}
      canDelete={canDelete}
      onEdit={handleEditTemplate}
      onDelete={() => handleDeleteClick(selectedTemplate as unknown as Template)}
      onClose={handleCloseDetail}
      onTemplateUpdated={handleTemplateUpdated}
    />
  ) : null

  const dialogs = (
    <>
      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  // Mobile: Show stacked view - list OR detail
  if (isMobile) {
    if (selectedTemplate) {
      return (
        <div className="h-[calc(100vh-140px)]">
          <MobileBackHeader
            title={selectedTemplate.name}
            onBack={handleCloseDetail}
          />
          {detailContent}
          {dialogs}
        </div>
      )
    }

    return (
      <div className="h-[calc(100vh-140px)]">
        {templateListContent}
        {dialogs}
      </div>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      {templateListContent}

      {/* Right Panel - Template Detail */}
      <div className="flex-1 min-w-0">
        {selectedTemplate ? (
          detailContent
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Select a template to view details
              </p>
            </div>
          </Card>
        )}
      </div>

      {dialogs}
    </div>
  )
})
