'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { useOwnershipTransfer } from '../hooks'

interface TransferOwnershipTabProps {
  ownershipTransfer: ReturnType<typeof useOwnershipTransfer>
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const TransferOwnershipTab = memo(function TransferOwnershipTab({
  ownershipTransfer,
  setError,
  setSuccess,
}: TransferOwnershipTabProps) {
  const t = useTranslations('settings.transfer')
  return (
    <Card className="w-full md:min-w-[28rem] border-orange-200">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-orange-700 text-lg md:text-xl">{t('title')}</CardTitle>
        <CardDescription className="text-sm">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {ownershipTransfer.adminMembers.length === 0 ? (
          <Alert>
            <AlertDescription>
              {t('noAdmins')}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label>{t('selectNewOwner')}</Label>
              <p className="text-xs text-muted-foreground mb-3">
                {t('selectHint')}
              </p>
              <div className="space-y-2">
                {ownershipTransfer.adminMembers.map((member) => {
                  const isSelected = ownershipTransfer.selectedNewOwner === member.id
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        ownershipTransfer.setSelectedNewOwner(isSelected ? '' : member.id)
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                          : 'border-black/20 dark:border-white/20 hover:border-orange-300 hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-medium text-sm md:text-base">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.email && (
                        <div className="text-xs md:text-sm text-muted-foreground truncate">{member.email}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <AlertDialog
              open={ownershipTransfer.transferDialogOpen}
              onOpenChange={ownershipTransfer.setTransferDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="!rounded-lg !border !border-orange-500 text-orange-700 hover:bg-orange-50 w-full sm:w-auto"
                  disabled={!ownershipTransfer.selectedNewOwner || ownershipTransfer.isTransferring}
                >
                  {t('transferButton')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] md:max-w-lg !border !border-black dark:!border-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich('dialog.description', {
                      name: `${ownershipTransfer.selectedMember?.first_name ?? ''} ${ownershipTransfer.selectedMember?.last_name ?? ''}`.trim(),
                      strong: (chunks) => <strong>{chunks}</strong>
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
                  <AlertDialogCancel disabled={ownershipTransfer.isTransferring} className="!rounded-lg !border-0 bg-white dark:bg-zinc-950 px-4 py-2">
                    {t('dialog.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      ownershipTransfer.handleTransferOwnership(setError, setSuccess, () => {})
                    }
                    disabled={ownershipTransfer.isTransferring}
                    className="!rounded-lg !border !border-orange-600 !bg-orange-600 hover:!bg-orange-700 !text-black !px-4 !py-2 disabled:!opacity-50"
                  >
                    {ownershipTransfer.isTransferring
                      ? t('dialog.transferring')
                      : t('dialog.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  )
})
