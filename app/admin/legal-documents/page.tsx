import { getLegalDocuments } from './actions'
import { LegalDocumentsClient } from './LegalDocumentsClient'

export default async function LegalDocumentsPage() {
  const { data: documents, error } = await getLegalDocuments()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return <LegalDocumentsClient initialDocuments={documents || {}} />
}
