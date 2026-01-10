'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  GripVertical,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks'
import type {
  LinkTreeLinkRow,
  LinkVisibility,
  CardSize,
  HoverEffect,
} from '../types'
import { useLinkItemHandlers } from './link-item/useLinkItemHandlers'
import { ColorPickerPopover } from './link-item/ColorPickerPopover'
import { IconPickerPopover } from './link-item/IconPickerPopover'
import { SizePickerPopover } from './link-item/SizePickerPopover'
import { HoverEffectPopover } from './link-item/HoverEffectPopover'
import { ImageUploadPopover } from './link-item/ImageUploadPopover'
import { LabelStylesPopover } from './link-item/LabelStylesPopover'

interface SortableLinkItemProps {
  link: LinkTreeLinkRow
  onEdit: () => void
  onDelete: () => void
  onUpdate: (updatedLink: LinkTreeLinkRow) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  clickCount?: number
  index?: number
  totalLinks?: number
}

export const SortableLinkItem = memo(function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
  clickCount,
  index = 0,
  totalLinks = 0,
}: SortableLinkItemProps) {
  const t = useTranslations('links')
  const isMobile = useIsMobile()
  const [iconOpen, setIconOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const {
    isUploading,
    handleToggleActive,
    handleIconChange,
    handleColorChange,
    handleSizeChange,
    handleHoverChange,
    handleToggleHideLabel,
    handleToggleBold,
    handleToggleItalic,
    handleToggleUnderline,
    handleImageUpload,
    handleRemoveImage,
  } = useLinkItemHandlers({ link, onUpdate })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const visibilityLabel = t(`visibility.${link.visibility as LinkVisibility}.label`)
  const currentSize = (link.card_size as CardSize) || 'medium'
  const currentHover = (link.hover_effect as HoverEffect) || 'none'

  const canMoveUp = index > 0
  const canMoveDown = index < totalLinks - 1

  // Mobile layout - cleaner stacked design
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-card border border-black dark:border-zinc-700 rounded-lg overflow-hidden',
          isDragging && 'opacity-50 shadow-lg',
          !link.is_active && 'opacity-60'
        )}
      >
        {/* Color bar at top */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: link.card_color || '#3B82F6' }}
        />

        <div className="p-3">
          {/* Header row: Title + Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('font-medium text-base', !link.is_active && 'text-muted-foreground')}>
                  {link.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {visibilityLabel}
                </Badge>
                {clickCount !== undefined && clickCount > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <BarChart3 className="h-3 w-3" />
                    {clickCount}
                  </span>
                )}
              </div>
            </div>

            {/* Reorder + Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveUp}
                disabled={!canMoveUp}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveDown}
                disabled={!canMoveDown}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Switch
                checked={link.is_active ?? false}
                onCheckedChange={handleToggleActive}
              />
            </div>
          </div>

          {/* URL row */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground truncate flex items-center gap-1 mt-2"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{link.url}</span>
          </a>

          {/* Action buttons row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex items-center gap-1">
              <ColorPickerPopover
                open={colorOpen}
                onOpenChange={setColorOpen}
                currentColor={link.card_color || '#3B82F6'}
                onColorChange={(color) => handleColorChange(color, () => setColorOpen(false))}
              />
              <IconPickerPopover
                open={iconOpen}
                onOpenChange={setIconOpen}
                currentIcon={link.icon}
                onIconChange={(icon) => handleIconChange(icon, () => setIconOpen(false))}
              />
            </div>

            {/* Edit / Delete */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-2 gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-xs">{t('linkItem.edit')}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 bg-card border border-black dark:border-zinc-700 rounded-lg',
        isDragging && 'opacity-50 shadow-lg',
        !link.is_active && 'opacity-60'
      )}
    >
      {/* Top row with drag, info, actions */}
      <div className="flex items-center gap-3">
        {/* Desktop Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Link Color Preview */}
        <div
          className="w-3 h-8 rounded-sm flex-shrink-0"
          style={{ backgroundColor: link.card_color || '#3B82F6' }}
        />

        {/* Link Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium truncate', !link.is_active && 'text-muted-foreground')}>
              {link.title}
            </span>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {visibilityLabel}
            </Badge>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1"
          >
            {link.url}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>

        {/* Main Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={link.is_active ?? false}
            onCheckedChange={handleToggleActive}
            title={link.is_active ? t('linkItem.hideLink') : t('linkItem.showLink')}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom row with inline action icons - Desktop only */}
      <div className="flex items-center gap-1 mt-2 ml-9 border-t pt-2">
        <TooltipProvider delayDuration={300}>
          <LabelStylesPopover
            open={labelOpen}
            onOpenChange={setLabelOpen}
            hideLabel={link.hide_label ?? false}
            labelBold={link.label_bold ?? false}
            labelItalic={link.label_italic ?? false}
            labelUnderline={link.label_underline ?? false}
            onToggleHideLabel={handleToggleHideLabel}
            onToggleBold={handleToggleBold}
            onToggleItalic={handleToggleItalic}
            onToggleUnderline={handleToggleUnderline}
            showTooltip
          />

          <IconPickerPopover
            open={iconOpen}
            onOpenChange={setIconOpen}
            currentIcon={link.icon}
            onIconChange={(icon) => handleIconChange(icon, () => setIconOpen(false))}
            showTooltip
          />

          <ImageUploadPopover
            open={imageOpen}
            onOpenChange={setImageOpen}
            linkId={link.id}
            imageUrl={link.image_url}
            isUploading={isUploading}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            showTooltip
          />

          <ColorPickerPopover
            open={colorOpen}
            onOpenChange={setColorOpen}
            currentColor={link.card_color || '#3B82F6'}
            onColorChange={(color) => handleColorChange(color, () => setColorOpen(false))}
            showTooltip
          />

          <SizePickerPopover
            open={sizeOpen}
            onOpenChange={setSizeOpen}
            currentSize={currentSize}
            onSizeChange={(size) => handleSizeChange(size, () => setSizeOpen(false))}
            showTooltip
          />

          <HoverEffectPopover
            open={hoverOpen}
            onOpenChange={setHoverOpen}
            currentEffect={currentHover}
            onEffectChange={(effect) => handleHoverChange(effect, () => setHoverOpen(false))}
            showTooltip
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Click Stats */}
          {clickCount !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground px-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">{clickCount}</span>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
})
