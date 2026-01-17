'use client'

import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { PendingRegistration, OfflineMember } from './types'

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: PendingRegistration | null
  filteredOfflineMembers: OfflineMember[]
  selectedProfileId: string
  memberSearch: string
  onSelectedProfileIdChange: (id: string) => void
  onMemberSearchChange: (value: string) => void
  onConfirm: () => void
}

export function LinkDialog({
  open,
  onOpenChange,
  registration,
  filteredOfflineMembers,
  selectedProfileId,
  memberSearch,
  onSelectedProfileIdChange,
  onMemberSearchChange,
  onConfirm,
}: LinkDialogProps) {
  const t = useTranslations('people')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] !border !border-black dark:!border-white">
        <DialogHeader>
          <DialogTitle>{t('linkDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('linkDialog.description', { name: `${registration?.first_name} ${registration?.last_name}` })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('linkDialog.searchPlaceholder')}
              value={memberSearch}
              onChange={(e) => onMemberSearchChange(e.target.value)}
              className="pl-9 !border !border-gray-300"
            />
          </div>
          <ScrollArea className="h-[200px] !border !border-gray-300 rounded-md">
            {filteredOfflineMembers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {memberSearch
                  ? t('linkDialog.noMatchingMembers')
                  : t('linkDialog.noOfflineMembers')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOfflineMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onSelectedProfileIdChange(member.id)}
                    className={`w-full text-left px-3 py-3 text-sm transition-colors ${
                      selectedProfileId === member.id
                        ? 'bg-brand/10 text-brand'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">
                      {member.first_name} {member.last_name}
                    </div>
                    {member.email && (
                      <div className="text-xs text-muted-foreground">
                        {member.email}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="!border !border-black dark:!border-white"
            onClick={() => onOpenChange(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedProfileId}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground !border !border-brand"
          >
            {t('linkDialog.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
