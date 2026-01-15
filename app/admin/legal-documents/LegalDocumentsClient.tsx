'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, FileText, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentList } from './components/DocumentList'
import { DocumentEditorDialog } from './components/DocumentEditorDialog'
import type { GroupedDocuments, DocumentType, Language } from './actions'

interface LegalDocumentsClientProps {
  initialDocuments: GroupedDocuments
}

const DOCUMENT_TYPES: { key: DocumentType; label: string }[] = [
  { key: 'terms_of_service', label: 'Terms of Service' },
  { key: 'privacy_policy', label: 'Privacy Policy' },
  { key: 'dpa', label: 'DPA' },
  { key: 'church_admin_terms', label: 'Admin Terms' },
]

const LANGUAGES: { key: Language; label: string; flag: string }[] = [
  { key: 'en', label: 'English', flag: '🇺🇸' },
  { key: 'pl', label: 'Polish', flag: '🇵🇱' },
]

export function LegalDocumentsClient({ initialDocuments }: LegalDocumentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial values from URL or use defaults
  const initialType = (searchParams.get('type') as DocumentType) || 'terms_of_service'
  const initialLang = (searchParams.get('lang') as Language) || 'en'

  const [mounted, setMounted] = useState(false)
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedType, setSelectedType] = useState<DocumentType>(
    DOCUMENT_TYPES.some(t => t.key === initialType) ? initialType : 'terms_of_service'
  )
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES.some(l => l.key === initialLang) ? initialLang : 'en'
  )
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)

  // Update URL when type or language changes
  const updateURL = useCallback((type: DocumentType, lang: Language) => {
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('lang', lang)
    router.replace(`/admin/legal-documents?${params.toString()}`, { scroll: false })
  }, [router])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update URL when selection changes
  useEffect(() => {
    if (mounted) {
      updateURL(selectedType, selectedLanguage)
    }
  }, [selectedType, selectedLanguage, mounted, updateURL])

  const currentDocs = documents[selectedType]?.[selectedLanguage] || []

  const handleNewDocument = () => {
    setEditingDocumentId(null)
    setIsEditorOpen(true)
  }

  const handleEditDocument = (id: string) => {
    setEditingDocumentId(id)
    setIsEditorOpen(true)
  }

  const refreshDocuments = async () => {
    router.refresh()
  }

  const selectedLang = LANGUAGES.find((l) => l.key === selectedLanguage)

  if (!mounted) {
    return null
  }

  return (
    <>
      <Card>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Legal Documents</CardTitle>
            <p className="text-muted-foreground">
              Manage document versions and acceptance settings
            </p>
          </div>
          <Button onClick={handleNewDocument} variant="ghost" className="gap-2 ring-1 ring-black hover:bg-muted">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-base font-medium">Document Versions</span>
          </div>
          <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
            <SelectTrigger className="w-[140px]">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue>
                {selectedLang?.flag} {selectedLang?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.key} value={lang.key}>
                  {lang.flag} {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 gap-1">
              {DOCUMENT_TYPES.map((type) => (
                <TabsTrigger
                  key={type.key}
                  value={type.key}
                  className="text-sm px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                >
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {DOCUMENT_TYPES.map((type) => (
              <TabsContent key={type.key} value={type.key} className="mt-4">
                <DocumentList
                  documents={currentDocs}
                  documentType={selectedType}
                  language={selectedLanguage}
                  onEdit={handleEditDocument}
                  onRefresh={refreshDocuments}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <DocumentEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        documentId={editingDocumentId}
        documentType={selectedType}
        language={selectedLanguage}
        onSuccess={refreshDocuments}
      />
    </>
  )
}
