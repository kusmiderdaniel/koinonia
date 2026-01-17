'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FileText, Plus, Search } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { FormCard } from './FormCard'
import type { FormWithRelations } from '../types'

type StatusFilter = 'all' | 'draft' | 'published' | 'closed'

interface FormsListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  forms: FormWithRelations[]
  selectedForm: FormWithRelations | null
  onSelectForm: (form: FormWithRelations) => void
  onCreateForm?: () => void
  onEditForm?: (form: FormWithRelations) => void
  onDuplicateForm?: (form: FormWithRelations) => void
  onDeleteForm?: (form: FormWithRelations) => void
  className?: string
}

export const FormsListView = memo(function FormsListView({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  forms,
  selectedForm,
  onSelectForm,
  onCreateForm,
  onEditForm,
  onDuplicateForm,
  onDeleteForm,
  className,
}: FormsListViewProps) {
  const t = useTranslations('forms')

  // Filter forms based on status
  const filteredForms = forms.filter((form) => {
    if (statusFilter === 'all') return true
    return form.status === statusFilter
  })

  return (
    <div className={`flex flex-col border border-black dark:border-white rounded-lg bg-card overflow-hidden ${className ?? ''}`}>
      {/* Search + Add Button */}
      <div className="p-3 border-b border-black/20 dark:border-white/20 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 !border !border-black/20 dark:!border-white/20"
          />
        </div>
        {onCreateForm && (
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 rounded-full !border !border-black/20 dark:!border-white/20"
            onClick={onCreateForm}
            title={t('newForm')}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Status Filter Toggle */}
      <div className="p-2 border-b border-black/20 dark:border-white/20">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(value) => value && onStatusFilterChange(value as StatusFilter)}
          className="w-full"
        >
          <ToggleGroupItem
            value="all"
            className="flex-1 rounded-full text-xs data-[state=on]:!bg-brand data-[state=on]:!text-black"
          >
            {t('filter.all')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="draft"
            className="flex-1 rounded-full text-xs data-[state=on]:!bg-brand data-[state=on]:!text-black"
          >
            {t('filter.draft')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="published"
            className="flex-1 rounded-full text-xs data-[state=on]:!bg-brand data-[state=on]:!text-black"
          >
            {t('filter.published')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Forms List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredForms.length > 0 ? (
          <div className="space-y-2">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                isSelected={selectedForm?.id === form.id}
                onClick={() => onSelectForm(form)}
                onEdit={onEditForm}
                onDuplicate={onDuplicateForm}
                onDelete={onDeleteForm}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title={forms.length === 0 ? t('empty.title') : t('empty.noMatch')}
            size="sm"
          />
        )}
      </div>
    </div>
  )
})
