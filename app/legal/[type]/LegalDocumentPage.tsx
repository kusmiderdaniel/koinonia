'use client'

import { format } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { ArrowLeft, FileText, Calendar, Hash, Printer, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface LegalDocument {
  id: string
  title: string
  content: string
  version: number
  effective_date: string
  document_type: string
  language: 'en' | 'pl'
}

interface LegalDocumentPageProps {
  document: LegalDocument
  typeTitle: string
}

export function LegalDocumentPage({ document, typeTitle }: LegalDocumentPageProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const dateFnsLocale = document.language === 'pl' ? pl : enUS

  const formattedDate = format(new Date(document.effective_date), 'PPP', {
    locale: dateFnsLocale,
  })

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const translations = {
    en: {
      backToApp: 'Back to App',
      version: 'Version',
      effectiveDate: 'Effective',
      print: 'Print',
      legalDocument: 'Legal Document',
    },
    pl: {
      backToApp: 'Wróć do aplikacji',
      version: 'Wersja',
      effectiveDate: 'Obowiązuje od',
      print: 'Drukuj',
      legalDocument: 'Dokument prawny',
    },
  }

  const t = translations[document.language]

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.backToApp}
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-brand">KOINONIA</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {t.print}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 print:py-0">
        <div className="mx-auto max-w-4xl">
          {/* Document Card */}
          <Card className="overflow-hidden print:border-0 print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-brand/10 to-brand/5 pb-6 print:bg-transparent">
              <div className="flex flex-col gap-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <FileText className="h-3 w-3" />
                    {t.legalDocument}
                  </Badge>
                  <Badge variant="outline">{typeTitle}</Badge>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl print:text-2xl">
                  {document.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4" />
                    <span>
                      {t.version} {document.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t.effectiveDate}: {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 print:p-0">
              {/* Document Content */}
              <article className="legal-document prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mt-8 mb-4 first:mt-0 border-b pb-2 print:text-lg">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mt-6 mb-3 print:text-base">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mt-5 mb-2 print:text-sm">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold mt-4 mb-2">{children}</h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-4 text-muted-foreground print:text-xs print:mb-2">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside ml-6 mb-4 space-y-2 print:space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 print:space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed text-muted-foreground pl-1 print:text-xs">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-brand underline underline-offset-2 hover:text-brand/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-brand/30 pl-4 my-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full text-sm border-collapse border border-border">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                    th: ({ children }) => (
                      <th className="border border-border px-3 py-2 text-left font-semibold text-xs">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-3 py-2 text-xs">{children}</td>
                    ),
                    hr: () => <hr className="my-8 border-border print:my-4" />,
                  }}
                >
                  {document.content}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
            <p>
              {document.language === 'pl'
                ? 'Ten dokument jest prawnie wiążący dla użytkowników Koinonia.'
                : 'This document is legally binding for Koinonia users.'}
            </p>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
