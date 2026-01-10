'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react'
import type { SavedView, ViewSelectorProps, BuiltInView } from '@/types/saved-views'

export function ViewSelector({
  views,
  selectedViewId,
  onSelectView,
  onCreateView,
  onEditView,
  onDeleteView,
  onSetDefault,
  canManageViews,
  isLoading = false,
  hasUnsavedChanges = false,
  onSaveChanges,
  isSavingChanges = false,
  builtInViews = [],
  onSelectBuiltInView,
}: ViewSelectorProps) {
  const t = useTranslations('views')
  const selectedView = views.find((v) => v.id === selectedViewId)
  const selectedBuiltInView = builtInViews.find((v) => v.id === selectedViewId)
  const hasViews = views.length > 0
  const hasBuiltInViews = builtInViews.length > 0
  const hasSelectedView = selectedViewId !== null
  const displayName = selectedView?.name || selectedBuiltInView?.name

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700 ${hasSelectedView ? '!border-brand text-brand' : ''}`}
            disabled={isLoading}
          >
            {hasSelectedView ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {t('title')}
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-white dark:bg-zinc-950">
        {/* "All" option - clears to defaults */}
        <DropdownMenuItem
          onClick={() => onSelectView(null)}
          className="cursor-pointer flex items-center justify-between"
        >
          <span>{t('all')}</span>
          {!hasSelectedView && <Check className="h-4 w-4 text-brand" />}
        </DropdownMenuItem>

        {/* Built-in views (e.g., "My Tasks") */}
        {hasBuiltInViews && builtInViews.map((view) => (
          <DropdownMenuItem
            key={view.id}
            onClick={() => {
              onSelectView(view.id)
              onSelectBuiltInView?.(view)
            }}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{view.name}</span>
            {selectedViewId === view.id && <Check className="h-4 w-4 text-brand" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Saved views list */}
        {hasViews ? (
          views.map((view) => (
            <ViewMenuItem
              key={view.id}
              view={view}
              isSelected={view.id === selectedViewId}
              canManage={canManageViews}
              onSelect={() => onSelectView(view.id)}
              onEdit={() => onEditView(view)}
              onDelete={() => onDeleteView(view)}
              onSetDefault={() => onSetDefault(view)}
            />
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t('noSavedViews')}
          </div>
        )}

        {/* Create new view option */}
        {canManageViews && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateView} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              {t('saveCurrentView')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

      {/* Save changes button - appears when view has unsaved changes */}
      {/* For built-in views, anyone can save (personal prefs). For saved views, only managers. */}
      {hasUnsavedChanges && hasSelectedView && (canManageViews || selectedBuiltInView) && onSaveChanges && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveChanges}
          disabled={isSavingChanges}
          className="gap-1 !border !border-brand text-brand hover:bg-brand/10"
        >
          {isSavingChanges ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{t('save')}</span>
        </Button>
      )}
    </div>
  )
}

// Sub-component for individual view menu items
function ViewMenuItem({
  view,
  isSelected,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  view: SavedView
  isSelected: boolean
  canManage: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  const t = useTranslations('views')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-sm group cursor-pointer">
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 text-sm text-left min-w-0"
      >
        {view.is_default && (
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
        )}
        <span className="truncate">{view.name}</span>
        {isSelected && <Check className="h-4 w-4 text-brand ml-auto flex-shrink-0" />}
      </button>

      {canManage && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={() => {
                setMenuOpen(false)
                onEdit()
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('edit')}
            </DropdownMenuItem>
            {!view.is_default && (
              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false)
                  onSetDefault()
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                {t('setAsDefault')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
