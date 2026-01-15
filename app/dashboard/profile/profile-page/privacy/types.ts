export interface ConsentRecord {
  id: string
  consent_type: string
  action: 'granted' | 'withdrawn'
  recorded_at: string
  document_version?: number
  data_categories_shared?: string[]
}

export interface DataExportStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  downloadUrl?: string
  expiresAt?: string
}

export interface DeletionStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'cancelled'
  scheduledAt?: string
}
