'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LegalDocumentViewer } from './LegalDocumentViewer'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

type DocumentType = 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms'

interface ConsentCheckboxProps {
  documentType: DocumentType
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
  disabled?: boolean
  className?: string
  /** Custom label override - use translation key format like "I agree to the {link}" */
  customLabel?: string
}

const documentTitleKeys: Record<DocumentType, string> = {
  terms_of_service: 'documents.termsOfService',
  privacy_policy: 'documents.privacyPolicy',
  dpa: 'documents.dpa',
  church_admin_terms: 'documents.churchAdminTerms',
}

const consentLabelKeys: Record<DocumentType, string> = {
  terms_of_service: 'consent.acceptTerms',
  privacy_policy: 'consent.acceptPrivacy',
  dpa: 'consent.acceptDpa',
  church_admin_terms: 'consent.acceptAdminTerms',
}

export function ConsentCheckbox({
  documentType,
  checked,
  onCheckedChange,
  error,
  disabled,
  className,
  customLabel,
}: ConsentCheckboxProps) {
  const t = useTranslations('legal')
  const [dialogOpen, setDialogOpen] = useState(false)

  const documentTitle = t(documentTitleKeys[documentType])
  const labelKey = consentLabelKeys[documentType]

  // Build the label with the link
  const labelParts = t(customLabel || labelKey, {
    link: '__LINK__',
  }).split('__LINK__')

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={`consent-${documentType}`}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
          className="mt-0.5 shrink-0"
          aria-invalid={!!error}
        />
        <Label
          htmlFor={`consent-${documentType}`}
          className={cn(
            'text-sm leading-relaxed cursor-pointer flex flex-wrap items-baseline gap-x-1',
            error && 'text-destructive'
          )}
        >
          <span>{labelParts[0]}</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium underline underline-offset-2 inline-flex items-center whitespace-nowrap"
                type="button"
              >
                {documentTitle}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] !border !border-black dark:!border-white">
              <DialogHeader>
                <DialogTitle>{documentTitle}</DialogTitle>
              </DialogHeader>
              <LegalDocumentViewer
                documentType={documentType}
                maxHeight="60vh"
              />
            </DialogContent>
          </Dialog>
          {labelParts[1] && <span>{labelParts[1]}</span>}
        </Label>
      </div>
      {error && (
        <p className="text-red-500 text-sm ml-7">{error}</p>
      )}
    </div>
  )
}
