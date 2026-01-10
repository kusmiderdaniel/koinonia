'use client'

import { useTranslations } from 'next-intl'
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

function HeaderWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function MembersTableHeader() {
  const t = useTranslations('people')

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[60px]">{t('tableHeader.active')}</TableHead>
        <TableHead>{t('tableHeader.name')}</TableHead>
        <TableHead>
          <HeaderWithTooltip label={t('tableHeader.email')} tooltip={t('tableHeader.emailTooltip')} />
        </TableHead>
        <TableHead>{t('tableHeader.role')}</TableHead>
        <TableHead>{t('tableHeader.campus')}</TableHead>
        <TableHead>{t('tableHeader.ministryRoles')}</TableHead>
        <TableHead>
          <HeaderWithTooltip label={t('tableHeader.gender')} tooltip={t('tableHeader.genderTooltip')} />
        </TableHead>
        <TableHead>
          <HeaderWithTooltip label={t('tableHeader.dateOfBirth')} tooltip={t('tableHeader.dateOfBirthTooltip')} />
        </TableHead>
        <TableHead>{t('tableHeader.age')}</TableHead>
        <TableHead className="w-[70px]">{t('tableHeader.baptized')}</TableHead>
        <TableHead>{t('tableHeader.baptismDate')}</TableHead>
        <TableHead>{t('tableHeader.departureDate')}</TableHead>
        <TableHead>{t('tableHeader.departureReason')}</TableHead>
        <TableHead>{t('tableHeader.joined')}</TableHead>
      </TableRow>
    </TableHeader>
  )
}
