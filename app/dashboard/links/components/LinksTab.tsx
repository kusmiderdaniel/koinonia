'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { SortableLinkItem } from './SortableLinkItem'
import { LinkDialog } from './LinkDialog'
import { LivePreview } from './LivePreview'
import { reorderLinks, deleteLink as deleteLinkAction } from '../actions'
import { useDialogState } from '@/lib/hooks'
import type { LinkTreeLinkRow, LinkTreeSettingsRow, AnalyticsSummary } from '../types'

interface LinksTabProps {
  links: LinkTreeLinkRow[]
  setLinks: (links: LinkTreeLinkRow[]) => void
  settings: LinkTreeSettingsRow | null
  churchName?: string
  churchLogo?: string | null
  analytics?: AnalyticsSummary | null
}

export function LinksTab({ links, setLinks, settings, churchName, churchLogo, analytics }: LinksTabProps) {
  const linkDialog = useDialogState<LinkTreeLinkRow>()

  // Create a map of link IDs to click counts
  const clickCountMap = new Map<string, number>()
  if (analytics?.links_stats) {
    analytics.links_stats.forEach((linkStat) => {
      clickCountMap.set(linkStat.id, linkStat.click_count ?? 0)
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id)
      const newIndex = links.findIndex((link) => link.id === over.id)

      const newLinks = arrayMove(links, oldIndex, newIndex)
      setLinks(newLinks)

      // Persist the new order
      const result = await reorderLinks(newLinks.map(l => l.id))
      if (result.error) {
        // Revert on error
        setLinks(links)
        toast.error('Failed to reorder links')
      }
    }
  }

  const handleAddLink = () => {
    linkDialog.open()
  }

  const handleEditLink = (link: LinkTreeLinkRow) => {
    linkDialog.open(link)
  }

  const handleDeleteLink = async (id: string) => {
    const result = await deleteLinkAction(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      setLinks(links.filter(l => l.id !== id))
      toast.success('Link deleted')
    }
  }

  const handleUpdateLink = (updatedLink: LinkTreeLinkRow) => {
    setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l))
  }

  const handleDialogClose = (updatedLink?: LinkTreeLinkRow) => {
    const wasEditing = linkDialog.item !== null
    linkDialog.close()

    if (updatedLink) {
      if (wasEditing) {
        // Update existing
        setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l))
      } else {
        // Add new
        setLinks([...links, updatedLink])
      }
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Links Management */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Add Link Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleAddLink}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {/* Links List */}
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No links yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first link to get started
            </p>
            <Button
              onClick={handleAddLink}
              variant="outline"
              className="!border !border-black dark:!border-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableLinkItem
                    key={link.id}
                    link={link}
                    onEdit={() => handleEditLink(link)}
                    onDelete={() => handleDeleteLink(link.id)}
                    onUpdate={handleUpdateLink}
                    clickCount={clickCountMap.get(link.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Link Dialog */}
        <LinkDialog
          open={linkDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose()
            else linkDialog.setOpen(open)
          }}
          link={linkDialog.item}
          onSave={handleDialogClose}
        />
      </div>

      {/* Live Preview */}
      <div className="w-72 flex-shrink-0 hidden lg:block">
        <LivePreview
          settings={settings}
          links={links}
          churchName={churchName}
          churchLogo={churchLogo}
        />
      </div>
    </div>
  )
}
