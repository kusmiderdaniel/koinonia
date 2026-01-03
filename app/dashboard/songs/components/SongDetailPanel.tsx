'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Music,
  Clock,
  Key,
  User,
  FileText,
  Download,
  Upload,
  X,
} from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { DetailPanelHeader } from '@/components/panels'
import { formatDuration } from '@/lib/utils/format'
import type { Song } from '../types'

interface SongDetailPanelProps {
  song: Song | null
  canManage: boolean
  isUploading: boolean
  isDeletingAttachment: string | null
  onEdit: (song: Song) => void
  onDelete: (song: Song) => void
  onUploadAttachment: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadAttachment: (attachmentId: string) => void
  onDeleteAttachment: (attachmentId: string) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SongDetailPanel({
  song,
  canManage,
  isUploading,
  isDeletingAttachment,
  onEdit,
  onDelete,
  onUploadAttachment,
  onDownloadAttachment,
  onDeleteAttachment,
}: SongDetailPanelProps) {
  if (!song) {
    return (
      <Card className="h-full flex items-center justify-center border border-black dark:border-zinc-700">
        <EmptyState
          icon={Music}
          title="Select a song"
          description="Choose a song to view details"
          size="sm"
        />
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-zinc-700 !gap-0">
      <DetailPanelHeader
        title={song.title}
        subtitle={
          song.artist && (
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {song.artist}
            </span>
          )
        }
        canManage={canManage}
        onEdit={() => onEdit(song)}
        onDelete={() => onDelete(song)}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Song Details */}
          <div className="flex flex-wrap gap-6">
            {song.default_key && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Default Key
                </label>
                <p className="text-lg font-medium flex items-center gap-2 mt-1">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  {song.default_key}
                </p>
              </div>
            )}
            {song.duration_seconds && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Duration
                </label>
                <p className="text-lg font-medium flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {formatDuration(song.duration_seconds)}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Tags
            </label>
            {song.tags && song.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {song.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white rounded-full px-3"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                Attachments
              </label>
              {canManage && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={onUploadAttachment}
                    disabled={isUploading}
                  />
                  <Button variant="outline-pill" size="sm" className="!border !border-gray-300 dark:!border-gray-600" asChild disabled={isUploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-1" />
                      {isUploading ? 'Uploading...' : 'Upload PDF'}
                    </span>
                  </Button>
                </label>
              )}
            </div>
            {song.song_attachments && song.song_attachments.length > 0 ? (
              <div className="space-y-2">
                {song.song_attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadAttachment(attachment.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAttachment(attachment.id)}
                          disabled={isDeletingAttachment === attachment.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {isDeletingAttachment === attachment.id ? (
                            <span className="w-4 h-4">...</span>
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
