'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Printer, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type DocumentType = 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms'

interface LegalDocumentViewerProps {
  documentType: DocumentType
  className?: string
  maxHeight?: string
}

interface LegalDocument {
  id: string
  title: string
  content: string
  version: number
  effective_date: string
}

export function LegalDocumentViewer({
  documentType,
  className,
  maxHeight = '400px',
}: LegalDocumentViewerProps) {
  const t = useTranslations('legal')
  const locale = useLocale()
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    async function fetchDocument() {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('legal_documents')
          .select('id, title, content, version, effective_date')
          .eq('document_type', documentType)
          .eq('language', locale)
          .eq('is_current', true)
          .single()

        if (fetchError) throw fetchError
        setDocument(data)
      } catch {
        setError(t('documents.error'))
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentType, locale, t])

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className={cn('text-destructive text-sm', className)}>
        {error || t('documents.error')}
      </div>
    )
  }

  const handleDownload = () => {
    if (isDownloading || !document) return

    setIsDownloading(true)
    try {
      const versionText = `${t('documents.version', { version: document.version })} | ${t('documents.effectiveDate', { date: new Date(document.effective_date).toLocaleDateString(locale) })}`

      // Function to convert markdown tables to HTML
      const convertTables = (text: string): string => {
        const lines = text.split('\n')
        const result: string[] = []
        let inTable = false
        let tableRows: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|')
          const isSeparator = /^\|[\s-:|]+\|$/.test(line.trim())

          if (isTableRow && !isSeparator) {
            if (!inTable) {
              inTable = true
              tableRows = []
            }
            tableRows.push(line)
          } else if (isSeparator && inTable) {
            // Skip separator line
            continue
          } else {
            if (inTable && tableRows.length > 0) {
              // Convert accumulated table rows to HTML
              let tableHtml = '<table>'
              tableRows.forEach((row, idx) => {
                const cells = row.split('|').filter(cell => cell.trim() !== '')
                const tag = idx === 0 ? 'th' : 'td'
                if (idx === 0) tableHtml += '<thead>'
                if (idx === 1) tableHtml += '<tbody>'
                tableHtml += '<tr>'
                cells.forEach(cell => {
                  tableHtml += `<${tag}>${cell.trim()}</${tag}>`
                })
                tableHtml += '</tr>'
                if (idx === 0) tableHtml += '</thead>'
              })
              tableHtml += '</tbody></table>'
              result.push(tableHtml)
              tableRows = []
              inTable = false
            }
            result.push(line)
          }
        }

        // Handle table at end of content
        if (inTable && tableRows.length > 0) {
          let tableHtml = '<table>'
          tableRows.forEach((row, idx) => {
            const cells = row.split('|').filter(cell => cell.trim() !== '')
            const tag = idx === 0 ? 'th' : 'td'
            if (idx === 0) tableHtml += '<thead>'
            if (idx === 1) tableHtml += '<tbody>'
            tableHtml += '<tr>'
            cells.forEach(cell => {
              tableHtml += `<${tag}>${cell.trim()}</${tag}>`
            })
            tableHtml += '</tr>'
            if (idx === 0) tableHtml += '</thead>'
          })
          tableHtml += '</tbody></table>'
          result.push(tableHtml)
        }

        return result.join('\n')
      }

      // Convert markdown to simple HTML
      let htmlContent = convertTables(document.content)
        // Headers
        .replace(/^#### (.*$)/gm, '</p><h4>$1</h4><p>')
        .replace(/^### (.*$)/gm, '</p><h3>$1</h3><p>')
        .replace(/^## (.*$)/gm, '</p><h2>$1</h2><p>')
        .replace(/^# (.*$)/gm, '</p><h1>$1</h1><p>')
        // Inline formatting
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists - mark them first
        .replace(/^- (.*)$/gm, '{{LI}}$1{{/LI}}')
        .replace(/^\d+\. (.*)$/gm, '{{LI}}$1{{/LI}}')

      // Wrap consecutive list items in ul
      htmlContent = htmlContent.replace(/({{LI}}[^{]*{{\/LI}}\n?)+/g, (match) => {
        const items = match
          .replace(/{{LI}}/g, '<li>')
          .replace(/{{\/LI}}/g, '</li>')
          .replace(/\n/g, '')
        return '</p><ul>' + items + '</ul><p>'
      })

      // Paragraphs
      htmlContent = htmlContent
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, ' ')
        // Clean up empty paragraphs
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<p><\/p>/g, '')

      // Create HTML content for print
      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${document.title} - Koinonia</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.4;
              color: #333;
              max-width: 100%;
              padding: 0;
              margin: 0;
            }
            .header {
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 20pt;
              margin: 0 0 6px 0;
              color: #000;
            }
            .header .meta {
              font-size: 9pt;
              color: #666;
            }
            .content h1 { font-size: 16pt; margin: 18px 0 8px 0; color: #000; }
            .content h2 { font-size: 13pt; margin: 14px 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #000; }
            .content h3 { font-size: 11pt; margin: 12px 0 4px 0; color: #000; }
            .content h4 { font-size: 10pt; margin: 10px 0 4px 0; color: #000; }
            .content p { margin: 0 0 8px 0; }
            .content ul { margin: 0 0 8px 0; padding-left: 20px; list-style-type: disc; }
            .content li { margin-bottom: 2px; padding-left: 4px; }
            .content strong { font-weight: 600; }
            .content br { display: block; margin: 4px 0; content: ""; }
            .content table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9pt; }
            .content th, .content td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            .content th { background: #f5f5f5; font-weight: 600; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${document.title}</h1>
            <div class="meta">${versionText}</div>
          </div>
          <div class="content">
            <p>${htmlContent}</p>
          </div>
        </body>
        </html>
      `

      // Create a Blob with the HTML content
      const blob = new Blob([printHtml], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)

      // Open the blob URL in a new window
      const printWindow = window.open(blobUrl, '_blank')
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl)
        throw new Error('Could not open print window')
      }

      // Wait for the window to load, then print and clean up
      printWindow.onload = () => {
        printWindow.print()
        printWindow.onafterprint = () => {
          printWindow.close()
          URL.revokeObjectURL(blobUrl)
        }
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{document.title}</h2>
          <p className="text-muted-foreground text-sm">
            {t('documents.version', { version: document.version })} |{' '}
            {t('documents.effectiveDate', {
              date: new Date(document.effective_date).toLocaleDateString(locale),
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="shrink-0"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          {t('documents.download')}
        </Button>
      </div>
      <div
        className="border rounded-lg bg-muted/30 overflow-y-auto"
        style={{ height: maxHeight }}
      >
        <div className="p-4 legal-document">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
              a: ({ href, children }) => (
                <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground">{children}</blockquote>
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
              hr: () => (
                <hr className="my-6 border-border" />
              ),
            }}
          >
            {document.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function useLegalDocument(documentType: DocumentType) {
  const locale = useLocale()
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocument() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('legal_documents')
          .select('id, title, content, version, effective_date')
          .eq('document_type', documentType)
          .eq('language', locale)
          .eq('is_current', true)
          .single()

        setDocument(data)
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentType, locale])

  return { document, loading }
}
