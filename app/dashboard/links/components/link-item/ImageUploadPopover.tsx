'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Image as ImageIcon, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linkId: string
  imageUrl: string | null
  isUploading: boolean
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, closePopover?: () => void) => void
  onRemoveImage: (closePopover?: () => void) => void
  showTooltip?: boolean
}

export function ImageUploadPopover({
  open,
  onOpenChange,
  linkId,
  imageUrl,
  isUploading,
  onImageUpload,
  onRemoveImage,
  showTooltip = false,
}: ImageUploadPopoverProps) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUpload(e, () => onOpenChange(false))
  }

  const handleRemove = () => {
    onRemoveImage(() => onOpenChange(false))
  }

  const trigger = (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-2 gap-1.5',
          imageUrl && 'text-foreground'
        )}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-xs">Image</span>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>Add thumbnail</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent
        className="w-64 p-3 !bg-white dark:!bg-zinc-950 border border-black dark:border-zinc-700"
        align="start"
      >
        <div className="space-y-3">
          <Label className="text-sm font-medium">Thumbnail Image</Label>

          {imageUrl ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-md overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Link thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="w-full"
              >
                <X className="h-4 w-4 mr-1" />
                Remove Image
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label
                htmlFor={`image-upload-${linkId}`}
                className={cn(
                  'flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50',
                  isUploading && 'opacity-50 pointer-events-none'
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Uploading...' : 'Click to upload'}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, WebP (max 5MB)
                </span>
              </Label>
              <Input
                id={`image-upload-${linkId}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
