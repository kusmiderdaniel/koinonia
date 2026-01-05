'use client'

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
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[60px]">Active</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>
          <HeaderWithTooltip label="Email" tooltip="Cannot be changed" />
        </TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Campus</TableHead>
        <TableHead>Ministry Roles</TableHead>
        <TableHead>
          <HeaderWithTooltip label="Sex" tooltip="Can be changed in user's profile settings" />
        </TableHead>
        <TableHead>
          <HeaderWithTooltip label="Date of Birth" tooltip="Can be changed in user's profile settings" />
        </TableHead>
        <TableHead>Age</TableHead>
        <TableHead className="w-[70px]">Baptized</TableHead>
        <TableHead>Baptism Date</TableHead>
        <TableHead>Departure Date</TableHead>
        <TableHead>Departure Reason</TableHead>
        <TableHead>Joined</TableHead>
      </TableRow>
    </TableHeader>
  )
}
