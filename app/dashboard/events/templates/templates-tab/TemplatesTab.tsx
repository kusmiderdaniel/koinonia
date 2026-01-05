'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { DetailPanelSkeleton } from '@/components/DynamicLoadingFallback'
import { MobileBackHeader } from '@/components/MobileBackHeader'
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

export const TemplatesTab = memo(function TemplatesTab() {
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
    />
  )

  const detailContent = state.selectedTemplate ? (
    <TemplateDetailPanel
      template={state.selectedTemplate}
      canManage={state.canManage}
      canDelete={state.canDelete}
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
          <MobileBackHeader
            title={state.selectedTemplate.name}
            onBack={state.handleCloseDetail}
          />
          <div className="flex-1 min-h-0">{detailContent}</div>
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
          onSearchChange={state.setSearchQuery}
          onSelectTemplate={state.handleSelectTemplate}
          onCreateTemplate={state.handleCreateTemplate}
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
        onSearchChange={state.setSearchQuery}
        onSelectTemplate={state.handleSelectTemplate}
        onCreateTemplate={state.handleCreateTemplate}
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
