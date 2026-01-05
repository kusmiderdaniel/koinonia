import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import {
  getEventTemplates,
  getEventTemplate,
  deleteEventTemplate,
} from '../actions'
import type { Template, TemplateDetail } from './types'

export function useTemplatesTabState() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [canDelete, setCanDelete] = useState(false)

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(
    null
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(
    null
  )

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    const result = await getEventTemplates()
    if (result.data) {
      setTemplates(result.data)
      setCanManage(result.canManage || false)
    }
    setIsLoading(false)
  }, [])

  const loadTemplateDetail = useCallback(async (templateId: string) => {
    const result = await getEventTemplate(templateId)
    if (result.data) {
      setSelectedTemplate(result.data)
      setCanDelete(result.canDelete || false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleSelectTemplate = useCallback(
    async (template: Template) => {
      await loadTemplateDetail(template.id)
    },
    [loadTemplateDetail]
  )

  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null)
    setTemplateDialogOpen(true)
  }, [])

  const handleEditTemplate = useCallback(() => {
    if (selectedTemplate) {
      setEditingTemplate(selectedTemplate)
      setTemplateDialogOpen(true)
    }
  }, [selectedTemplate])

  const handleDeleteClick = useCallback((template: Template) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
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
  }, [templateToDelete, selectedTemplate, loadTemplates])

  const handleDialogSuccess = useCallback(async () => {
    setTemplateDialogOpen(false)
    setEditingTemplate(null)
    await loadTemplates()
    // If we were editing, refresh the detail view
    if (editingTemplate && selectedTemplate) {
      await loadTemplateDetail(selectedTemplate.id)
    }
  }, [editingTemplate, selectedTemplate, loadTemplates, loadTemplateDetail])

  const handleCloseDetail = useCallback(() => {
    setSelectedTemplate(null)
  }, [])

  const handleTemplateUpdated = useCallback(async () => {
    await loadTemplates()
    if (selectedTemplate) {
      await loadTemplateDetail(selectedTemplate.id)
    }
  }, [loadTemplates, loadTemplateDetail, selectedTemplate])

  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchQuery) return templates
    const query = debouncedSearchQuery.toLowerCase()
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
    )
  }, [templates, debouncedSearchQuery])

  return {
    templates,
    filteredTemplates,
    selectedTemplate,
    searchQuery,
    setSearchQuery,
    isLoading,
    canManage,
    canDelete,

    // Dialog state
    templateDialogOpen,
    setTemplateDialogOpen,
    editingTemplate,
    deleteDialogOpen,
    setDeleteDialogOpen,
    templateToDelete,

    // Handlers
    handleSelectTemplate,
    handleCreateTemplate,
    handleEditTemplate,
    handleDeleteClick,
    handleConfirmDelete,
    handleDialogSuccess,
    handleCloseDetail,
    handleTemplateUpdated,
  }
}
