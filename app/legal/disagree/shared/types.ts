export interface PendingDisagreement {
  id: string
  documentType: string
  documentTitle: string
  deadline: string
  isChurchDeletion: boolean
}

export interface DisagreementTranslations {
  documentTypes: Record<string, string>
  error: {
    title: string
    backToDashboard: string
  }
  pending: {
    title: string
    description: string
    deadline: string
    reAgree: string
    viewDocument: string
    backToDashboard: string
  }
  warning: {
    title: string
    subtitle: string
    alertTitle: string
    alertDescription: string
    effectiveDate: string
    deletionDeadline: string
    acknowledgement: string
    goBack: string
    continueButton: string
  }
  confirm: {
    title: string
    description: string
    password: string
    passwordPlaceholder: string
    checkbox: string
    goBack: string
    confirmButton: string
    processing: string
  }
  toast: {
    disagreementRecorded: string
    disagreementWithdrawn: string
    error: string
  }
}
