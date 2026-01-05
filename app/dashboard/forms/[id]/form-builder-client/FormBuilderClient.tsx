'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FormBuilder } from '../builder/FormBuilder'
import { PreviewPanel } from '../builder/preview-panel'
import { ResponsesTable } from '../responses/ResponsesTable'
import { useFormBuilderClientState } from './useFormBuilderClientState'
import { FormBuilderHeader } from './FormBuilderHeader'
import type { FormBuilderClientProps } from './types'

export function FormBuilderClient({ initialData }: FormBuilderClientProps) {
  const state = useFormBuilderClientState({ initialData })

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <FormBuilderHeader
        currentForm={state.currentForm}
        isDirty={state.isDirty}
        isSaving={state.isSaving}
        isEditingTitle={state.isEditingTitle}
        editTitle={state.editTitle}
        copiedLink={state.copiedLink}
        onEditTitleChange={state.setEditTitle}
        onTitleSave={state.handleTitleSave}
        onStartEditTitle={() => {
          state.setEditTitle(state.currentForm.title)
          state.setIsEditingTitle(true)
        }}
        onCancelEditTitle={() => {
          state.setEditTitle(state.currentForm.title)
          state.setIsEditingTitle(false)
        }}
        onSave={state.handleSave}
        onPublish={state.handlePublish}
        onUnpublish={state.handleUnpublish}
        onClose={state.handleClose}
        onCopyLink={state.handleCopyLink}
        onPreview={() => state.setIsPreviewOpen(true)}
        onNavigateToForms={() => state.router.push('/dashboard/forms')}
      />

      {/* Tabs */}
      <Tabs
        value={state.activeTab}
        onValueChange={state.setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="border-b px-4 shrink-0">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger
              value="build"
              className="h-8 px-3 rounded-md data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              Build
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="h-8 px-3 rounded-md data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              Responses ({initialData.submissionsCount})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="build" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <FormBuilder />
        </TabsContent>

        <TabsContent
          value="responses"
          className="flex-1 mt-0 min-h-0 overflow-hidden"
        >
          <ResponsesTable formId={state.currentForm.id} fields={initialData.fields} />
        </TabsContent>
      </Tabs>

      {/* Preview Sheet */}
      <Sheet open={state.isPreviewOpen} onOpenChange={state.setIsPreviewOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 !bg-white dark:!bg-zinc-950"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Form Preview</SheetTitle>
          </SheetHeader>
          <PreviewPanel
            onClose={() => state.setIsPreviewOpen(false)}
            weekStartsOn={initialData.firstDayOfWeek}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
