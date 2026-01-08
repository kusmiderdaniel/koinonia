'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { DetailPanelSkeleton } from '@/components/DynamicLoadingFallback'
import { useIsMobile } from '@/lib/hooks'
import { useTemplatesTabState } from './useTemplatesTabState'
import { TemplatesList } from './TemplatesList'
import { TemplatesDialogs } from './TemplatesDialogs'
import type { Template } from './types'

// Dynamic import for heavy detail panel
const TemplateDetailPanel = dynamic(
  () =>
    import('../TemplateDetailPanel').then((mod) => ({
      default: mod.TemplateDetailPanel,
    })),
  { loading: () => <DetailPanelSkeleton />, ssr: false }
)

interface TemplatesTabProps {
  timeFormat?: '12h' | '24h'
}

export const TemplatesTab = memo(function TemplatesTab({ timeFormat }: TemplatesTabProps) {
  const isMobile = useIsMobile()
  const state = useTemplatesTabState()

  const dialogs = (
    <TemplatesDialogs
      templateDialogOpen={state.templateDialogOpen}
      onTemplateDialogOpenChange={state.setTemplateDialogOpen}
      editingTemplate={state.editingTemplate}
      onDialogSuccess={state.handleDialogSuccess}
      deleteDialogOpen={state.deleteDialogOpen}
      onDeleteDialogOpenChange={state.setDeleteDialogOpen}
      templateToDelete={state.templateToDelete}
      onConfirmDelete={state.handleConfirmDelete}
      timeFormat={timeFormat}
    />
  )

  const detailContent = state.selectedTemplate ? (
    <TemplateDetailPanel
      template={state.selectedTemplate}
      canManage={state.canManage}
      canDelete={state.canDelete}
      timeFormat={timeFormat}
      onEdit={state.handleEditTemplate}
      onDelete={() =>
        state.handleDeleteClick(state.selectedTemplate as unknown as Template)
      }
      onClose={state.handleCloseDetail}
      onTemplateUpdated={state.handleTemplateUpdated}
    />
  ) : null

  // Mobile: Show stacked view - list OR detail
  if (isMobile) {
    if (state.selectedTemplate) {
      return (
        <div className="h-full flex flex-col">
          {detailContent}
          {dialogs}
        </div>
      )
    }

    return (
      <div className="h-full">
        <TemplatesList
          templates={state.templates}
          filteredTemplates={state.filteredTemplates}
          selectedTemplate={state.selectedTemplate}
          searchQuery={state.searchQuery}
          isLoading={state.isLoading}
          canManage={state.canManage}
          isMobile={isMobile}
          timeFormat={timeFormat}
          onSearchChange={state.setSearchQuery}
          onSelectTemplate={state.handleSelectTemplate}
          onCreateTemplate={state.handleCreateTemplate}
          onEditTemplate={state.handleEditTemplateFromList}
          onDuplicateTemplate={state.handleDuplicateTemplate}
          onDeleteTemplate={state.handleDeleteClick}
        />
        {dialogs}
      </div>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className="flex gap-6 h-full">
      <TemplatesList
        templates={state.templates}
        filteredTemplates={state.filteredTemplates}
        selectedTemplate={state.selectedTemplate}
        searchQuery={state.searchQuery}
        isLoading={state.isLoading}
        canManage={state.canManage}
        isMobile={isMobile}
        timeFormat={timeFormat}
        onSearchChange={state.setSearchQuery}
        onSelectTemplate={state.handleSelectTemplate}
        onCreateTemplate={state.handleCreateTemplate}
        onEditTemplate={state.handleEditTemplateFromList}
        onDuplicateTemplate={state.handleDuplicateTemplate}
        onDeleteTemplate={state.handleDeleteClick}
      />

      {/* Right Panel - Template Detail */}
      <div className="flex-1 min-w-0">
        {state.selectedTemplate ? (
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
