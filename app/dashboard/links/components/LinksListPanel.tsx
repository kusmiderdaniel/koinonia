'use client'

import { useState } from 'react'
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
import { reorderLinks, deleteLink as deleteLinkAction } from '../actions'
import { useIsMobile } from '@/lib/hooks'
import type { LinkTreeLinkRow, AnalyticsSummary } from '../types'

interface LinksListPanelProps {
  links: LinkTreeLinkRow[]
  setLinks: (links: LinkTreeLinkRow[]) => void
  analytics?: AnalyticsSummary | null
}

export function LinksListPanel({ links, setLinks, analytics }: LinksListPanelProps) {
  const isMobile = useIsMobile()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkTreeLinkRow | null>(null)

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
    setEditingLink(null)
    setDialogOpen(true)
  }

  const handleEditLink = (link: LinkTreeLinkRow) => {
    setEditingLink(link)
    setDialogOpen(true)
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
    setDialogOpen(false)
    setEditingLink(null)

    if (updatedLink) {
      if (editingLink) {
        // Update existing
        setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l))
      } else {
        // Add new
        setLinks([...links, updatedLink])
      }
    }
  }

  // Mobile reordering handlers
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[index - 1]
    newLinks[index - 1] = temp
    setLinks(newLinks)

    const result = await reorderLinks(newLinks.map(l => l.id))
    if (result.error) {
      setLinks(links) // Revert on error
      toast.error('Failed to reorder links')
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index >= links.length - 1) return
    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[index + 1]
    newLinks[index + 1] = temp
    setLinks(newLinks)

    const result = await reorderLinks(newLinks.map(l => l.id))
    if (result.error) {
      setLinks(links) // Revert on error
      toast.error('Failed to reorder links')
    }
  }

  return (
    <div className="space-y-4 h-full">
      {/* Add Link Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Links</h3>
        <Button
          onClick={handleAddLink}
          size="sm"
          className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
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
      ) : isMobile ? (
        /* Mobile - no DnD, use up/down buttons */
        <div className="space-y-2">
          {links.map((link, index) => (
            <SortableLinkItem
              key={link.id}
              link={link}
              onEdit={() => handleEditLink(link)}
              onDelete={() => handleDeleteLink(link.id)}
              onUpdate={handleUpdateLink}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              clickCount={clickCountMap.get(link.id)}
              index={index}
              totalLinks={links.length}
            />
          ))}
        </div>
      ) : (
        /* Desktop - DnD enabled */
        <DndContext
          id="links-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {links.map((link, index) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onEdit={() => handleEditLink(link)}
                  onDelete={() => handleDeleteLink(link.id)}
                  onUpdate={handleUpdateLink}
                  clickCount={clickCountMap.get(link.id)}
                  index={index}
                  totalLinks={links.length}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Link Dialog */}
      <LinkDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose()
          else setDialogOpen(open)
        }}
        link={editingLink}
        onSave={handleDialogClose}
      />
    </div>
  )
}
