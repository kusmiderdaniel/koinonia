'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2, Upload, BarChart3, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DocumentPreviewDialog } from './DocumentPreviewDialog'
import { PublishDialog } from './PublishDialog'
import { StatisticsDialog } from './StatisticsDialog'
import { deleteDraftDocument } from '../actions'
import type { LegalDocumentWithStats, DocumentType, Language } from '../actions'
import { toast } from 'sonner'

interface DocumentListProps {
  documents: LegalDocumentWithStats[]
  documentType: DocumentType
  language: Language
  onEdit: (id: string) => void
  onRefresh: () => void
}

export function DocumentList({
  documents,
  documentType,
  language,
  onEdit,
  onRefresh,
}: DocumentListProps) {
  const [previewDoc, setPreviewDoc] = useState<LegalDocumentWithStats | null>(null)
  const [publishDoc, setPublishDoc] = useState<LegalDocumentWithStats | null>(null)
  const [statsDoc, setStatsDoc] = useState<LegalDocumentWithStats | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<LegalDocumentWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteDoc) return

    setIsDeleting(true)
    const result = await deleteDraftDocument(deleteDoc.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document deleted')
      onRefresh()
    }
    setDeleteDoc(null)
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No documents yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Click "New Document" to create the first version.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              doc.is_current
                ? 'bg-brand/10 border-brand/30 dark:bg-brand/10 dark:border-brand/30'
                : doc.status === 'draft'
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                : 'bg-muted/30 border-transparent'
            }`}
          >
            {/* Left side - Version & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {doc.is_current ? (
                  <CheckCircle2 className="h-5 w-5 text-brand" />
                ) : doc.status === 'draft' ? (
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <div className="h-5 w-5" />
                )}
                <span className="font-semibold text-lg">v{doc.version}</span>
              </div>

              <div className="flex items-center gap-2">
                {doc.is_current && (
                  <Badge className="bg-brand hover:bg-brand !text-brand-foreground">Current</Badge>
                )}
                {doc.status === 'draft' && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                    Draft
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">
                  {doc.acceptance_type}
                </Badge>
              </div>
            </div>

            {/* Middle - Date & Stats */}
            <div className="flex-1 px-6">
              <p className="text-sm text-muted-foreground">
                {doc.status === 'published' && doc.published_at ? (
                  <>
                    Published {new Date(doc.published_at).toLocaleDateString()}
                    {doc.accepted_count > 0 && (
                      <span className="ml-2 text-foreground">
                        · {doc.accepted_count.toLocaleString()} accepted
                      </span>
                    )}
                  </>
                ) : (
                  <>Created {new Date(doc.created_at).toLocaleDateString()}</>
                )}
              </p>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewDoc(doc)}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {doc.status === 'published' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStatsDoc(doc)}
                  title="Statistics"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}

              {doc.status === 'draft' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(doc.id)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPublishDoc(doc)}
                    className="ml-2"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  {doc.status === 'draft' && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(doc.id)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDoc(doc)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {doc.status === 'published' && (
                    <DropdownMenuItem onClick={() => setStatsDoc(doc)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Statistics
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Publish Dialog */}
      <PublishDialog
        document={publishDoc}
        onClose={() => setPublishDoc(null)}
        onSuccess={onRefresh}
      />

      {/* Statistics Dialog */}
      <StatisticsDialog
        document={statsDoc}
        onClose={() => setStatsDoc(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete version {deleteDoc?.version} of this document.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="!border-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
