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
import { isColumnVisible, type PeopleColumnKey } from './columns'

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

interface MembersTableHeaderProps {
  visibleColumns: PeopleColumnKey[] | null
}

export function MembersTableHeader({ visibleColumns }: MembersTableHeaderProps) {
  const t = useTranslations('people')

  const show = (key: PeopleColumnKey) => isColumnVisible(key, visibleColumns)

  return (
    <TableHeader>
      <TableRow>
        {show('active') && (
          <TableHead className="w-[60px]">{t('tableHeader.active')}</TableHead>
        )}
        {show('name') && (
          <TableHead>{t('tableHeader.name')}</TableHead>
        )}
        {show('email') && (
          <TableHead>
            <HeaderWithTooltip label={t('tableHeader.email')} tooltip={t('tableHeader.emailTooltip')} />
          </TableHead>
        )}
        {show('phone') && (
          <TableHead>{t('tableHeader.phone')}</TableHead>
        )}
        {show('role') && (
          <TableHead>{t('tableHeader.role')}</TableHead>
        )}
        {show('campus') && (
          <TableHead>{t('tableHeader.campus')}</TableHead>
        )}
        {show('ministry_roles') && (
          <TableHead>{t('tableHeader.ministryRoles')}</TableHead>
        )}
        {show('gender') && (
          <TableHead>
            <HeaderWithTooltip label={t('tableHeader.gender')} tooltip={t('tableHeader.genderTooltip')} />
          </TableHead>
        )}
        {show('date_of_birth') && (
          <TableHead>
            <HeaderWithTooltip label={t('tableHeader.dateOfBirth')} tooltip={t('tableHeader.dateOfBirthTooltip')} />
          </TableHead>
        )}
        {show('age') && (
          <TableHead>{t('tableHeader.age')}</TableHead>
        )}
        {show('baptized') && (
          <TableHead className="w-[70px]">{t('tableHeader.baptized')}</TableHead>
        )}
        {show('baptism_date') && (
          <TableHead>{t('tableHeader.baptismDate')}</TableHead>
        )}
        {show('departure_date') && (
          <TableHead>{t('tableHeader.departureDate')}</TableHead>
        )}
        {show('departure_reason') && (
          <TableHead>{t('tableHeader.departureReason')}</TableHead>
        )}
        {show('joined') && (
          <TableHead>{t('tableHeader.joined')}</TableHead>
        )}
      </TableRow>
    </TableHeader>
  )
}
