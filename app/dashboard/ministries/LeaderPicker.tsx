'use client'

import { useState, memo, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { isLeaderOrAbove } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, User } from 'lucide-react'

interface Leader {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
  campus_ids: string[]
}

interface Ministry {
  id: string
  name: string
  leader_id: string | null
}

interface LeaderPickerTranslations {
  title: string
  searchPlaceholder: string
  noLeadersFound: string
  change: string
  leads: string
}

interface LeaderPickerProps {
  selectedLeaderId: string
  onSelect: (leaderId: string) => void
  leaders: Leader[]
  ministries: Ministry[]
  currentMinistryId?: string
  translations: LeaderPickerTranslations
}

export const LeaderPicker = memo(function LeaderPicker({
  selectedLeaderId,
  onSelect,
  leaders,
  ministries,
  currentMinistryId,
  translations,
}: LeaderPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const selectedLeader = leaders.find((l) => l.id === selectedLeaderId)

  // Filter leaders by role and search term (debounced for performance)
  const eligibleLeaders = useMemo(() => {
    return leaders
      .filter((leader) => isLeaderOrAbove(leader.role))
      .filter((leader) => {
        if (!debouncedSearch) return true
        const fullName = `${leader.first_name} ${leader.last_name}`.toLowerCase()
        return fullName.includes(debouncedSearch.toLowerCase())
      })
  }, [leaders, debouncedSearch])

  // Get ministries led by a specific leader (excluding current ministry being edited)
  const getMinistriesLedBy = (leaderId: string) => {
    return ministries.filter(
      (m) => m.leader_id === leaderId && m.id !== currentMinistryId
    )
  }

  const handleSelect = (leaderId: string) => {
    onSelect(leaderId)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="space-y-2">
      {selectedLeader ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-2 border border-black/20 dark:border-white/20 rounded-lg bg-gray-50 dark:bg-zinc-900">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">
              {selectedLeader.first_name} {selectedLeader.last_name}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="shrink-0 !border !border-black/20 dark:!border-white/20"
          >
            {translations.change}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-start text-muted-foreground !border !border-black/20 dark:!border-white/20"
        >
          <User className="w-4 h-4 mr-2" />
          {translations.title}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md !border !border-black dark:!border-white" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{translations.title}</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={translations.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 !border !border-black/20 dark:!border-white/20"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
            {eligibleLeaders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {translations.noLeadersFound}
              </p>
            ) : (
              <div className="space-y-1">
                {eligibleLeaders.map((leader) => {
                  const leaderMinistries = getMinistriesLedBy(leader.id)
                  const isSelected = selectedLeaderId === leader.id

                  return (
                    <button
                      key={leader.id}
                      type="button"
                      onClick={() => handleSelect(leader.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border border-black/20 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                        isSelected ? 'bg-gray-100 dark:bg-zinc-800' : ''
                      }`}
                    >
                      <div className="font-medium">
                        {leader.first_name} {leader.last_name}
                      </div>
                      {leaderMinistries.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {translations.leads} {leaderMinistries.map((m) => m.name).join(', ')}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
