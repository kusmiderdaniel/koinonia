'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { publishDocument } from '../actions'
import type { LegalDocumentWithStats } from '../actions'
import { toast } from 'sonner'

interface PublishDialogProps {
  document: LegalDocumentWithStats | null
  onClose: () => void
  onSuccess: () => void
}

export function PublishDialog({ document, onClose, onSuccess }: PublishDialogProps) {
  const [sendEmail, setSendEmail] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  if (!document) return null

  const handlePublish = async () => {
    setIsPublishing(true)
    const result = await publishDocument(document.id, sendEmail)
    setIsPublishing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document published successfully')
      onClose()
      onSuccess()
    }
  }

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish {document.title}?</DialogTitle>
          <DialogDescription>
            This will make version {document.version} the current version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">This will:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Make v{document.version} the current version</li>
              <li>Archive the previous current version</li>
            </ul>
          </div>

          <Alert variant={document.acceptance_type === 'active' ? 'default' : undefined}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {document.acceptance_type === 'active' ? (
                <>
                  <strong>Active acceptance:</strong> Users will need to re-accept
                  this document before continuing to use the platform.
                </>
              ) : (
                <>
                  <strong>Silent acceptance:</strong> Users will automatically
                  accept this document on their next login. No re-consent required.
                </>
              )}
            </AlertDescription>
          </Alert>

          {document.acceptance_type === 'active' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked === true)}
              />
              <Label htmlFor="send-email" className="text-sm">
                Send email notification to all users
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
