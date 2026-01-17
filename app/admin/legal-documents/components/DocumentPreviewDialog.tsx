'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { LegalDocumentWithStats } from '../actions'

interface DocumentPreviewDialogProps {
  document: LegalDocumentWithStats | null
  onClose: () => void
}

export function DocumentPreviewDialog({
  document,
  onClose,
}: DocumentPreviewDialogProps) {
  if (!document) return null

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] flex flex-col !border !border-black dark:!border-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{document.title}</DialogTitle>
            <Badge variant="secondary">v{document.version}</Badge>
            {document.is_current && (
              <Badge variant="default" className="bg-green-600">
                Current
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Effective: {new Date(document.effective_date).toLocaleDateString()}
            {' · '}
            Acceptance: {document.acceptance_type}
          </p>
        </DialogHeader>

        <div className="h-[60vh] overflow-y-auto border rounded-lg bg-muted/30">
          <div className="prose prose-sm max-w-none dark:prose-invert p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-6 mb-3 border-b pb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold mt-3 mb-2">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-3 text-muted-foreground">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-6 mb-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-6 mb-4 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm leading-relaxed text-muted-foreground pl-1">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full text-xs border-collapse border border-border">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-2 py-1.5 text-left font-semibold text-xs">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-2 py-1.5 text-xs">{children}</td>
                ),
              }}
            >
              {document.content}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
