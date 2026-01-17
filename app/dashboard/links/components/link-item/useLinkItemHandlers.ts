import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { updateLink, uploadLinkImage, deleteLinkImage } from '../../actions'
import type { LinkTreeLinkRow, CardSize, HoverEffect } from '../../types'
import type { LabelAlign } from './LabelStylesPopover'

interface UseLinkItemHandlersProps {
  link: LinkTreeLinkRow
  onUpdate: (updatedLink: LinkTreeLinkRow) => void
}

export function useLinkItemHandlers({ link, onUpdate }: UseLinkItemHandlersProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleToggleActive = useCallback(async () => {
    const result = await updateLink(link.id, { is_active: !link.is_active })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(link.is_active ? 'Link hidden' : 'Link visible')
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, link.is_active, onUpdate])

  const handleIconChange = useCallback(async (iconName: string | null, closePopover?: () => void) => {
    const result = await updateLink(link.id, { icon: iconName })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Icon updated')
      if (result.link) onUpdate(result.link)
      closePopover?.()
    }
  }, [link.id, onUpdate])

  const handleColorChange = useCallback(async (color: string, closePopover?: () => void) => {
    const result = await updateLink(link.id, { card_color: color })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Color updated')
      if (result.link) onUpdate(result.link)
      closePopover?.()
    }
  }, [link.id, onUpdate])

  const handleSizeChange = useCallback(async (size: CardSize, closePopover?: () => void) => {
    const result = await updateLink(link.id, { card_size: size })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Size updated')
      if (result.link) onUpdate(result.link)
      closePopover?.()
    }
  }, [link.id, onUpdate])

  const handleHoverChange = useCallback(async (effect: HoverEffect, closePopover?: () => void) => {
    const result = await updateLink(link.id, { hover_effect: effect })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Hover effect updated')
      if (result.link) onUpdate(result.link)
      closePopover?.()
    }
  }, [link.id, onUpdate])

  const handleToggleHideLabel = useCallback(async () => {
    const result = await updateLink(link.id, { hide_label: !link.hide_label })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(link.hide_label ? 'Label shown' : 'Label hidden')
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, link.hide_label, onUpdate])

  const handleToggleBold = useCallback(async () => {
    const result = await updateLink(link.id, { label_bold: !link.label_bold })
    if (result.error) {
      toast.error(result.error)
    } else {
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, link.label_bold, onUpdate])

  const handleToggleItalic = useCallback(async () => {
    const result = await updateLink(link.id, { label_italic: !link.label_italic })
    if (result.error) {
      toast.error(result.error)
    } else {
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, link.label_italic, onUpdate])

  const handleToggleUnderline = useCallback(async () => {
    const result = await updateLink(link.id, { label_underline: !link.label_underline })
    if (result.error) {
      toast.error(result.error)
    } else {
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, link.label_underline, onUpdate])

  const handleAlignChange = useCallback(async (align: LabelAlign) => {
    const result = await updateLink(link.id, { label_align: align })
    if (result.error) {
      toast.error(result.error)
    } else {
      if (result.link) onUpdate(result.link)
    }
  }, [link.id, onUpdate])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, closePopover?: () => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResult = await uploadLinkImage(formData)
      if (uploadResult.error) {
        toast.error(uploadResult.error)
        return
      }

      // Delete old image if exists
      if (link.image_url) {
        await deleteLinkImage(link.image_url)
      }

      // Update link with new image
      const result = await updateLink(link.id, { image_url: uploadResult.url })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Image uploaded')
        if (result.link) onUpdate(result.link)
        closePopover?.()
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [link.id, link.image_url, onUpdate])

  const handleRemoveImage = useCallback(async (closePopover?: () => void) => {
    if (link.image_url) {
      await deleteLinkImage(link.image_url)
    }
    const result = await updateLink(link.id, { image_url: null })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Image removed')
      if (result.link) onUpdate(result.link)
      closePopover?.()
    }
  }, [link.id, link.image_url, onUpdate])

  return {
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
    handleAlignChange,
    handleImageUpload,
    handleRemoveImage,
  }
}
