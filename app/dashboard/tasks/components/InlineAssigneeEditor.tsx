'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, X, Search } from 'lucide-react'
import type { Person } from '../types'

interface InlineAssigneeEditorProps {
  assigneeId: string | null
  assignee: Person | null | undefined
  members: Person[]
  onUpdate: (assigneeId: string | null) => Promise<void>
  disabled?: boolean
}

export function InlineAssigneeEditor({
  assigneeId,
  assignee,
  members,
  onUpdate,
  disabled = false,
}: InlineAssigneeEditorProps) {
  const t = useTranslations('tasks')
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [search, setSearch] = useState('')

  const filteredMembers = useMemo(() => {
    if (!search) return members
    const query = search.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query)
    )
  }, [members, search])

  const handleSelect = async (memberId: string | null) => {
    if (memberId === assigneeId || isUpdating) return
    setIsUpdating(true)
    setOpen(false)
    setSearch('')
    try {
      await onUpdate(memberId)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setSearch('')
    }}>
      <PopoverTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded text-left min-w-[100px]">
          <span
            className={`flex items-center gap-1 text-sm hover:bg-muted px-2 py-1 rounded ${isUpdating ? 'opacity-50' : ''}`}
          >
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            {assignee ? (
              <span className="truncate">
                {assignee.first_name} {assignee.last_name}
              </span>
            ) : (
              <span className="text-muted-foreground">{t('groupBy.unassigned')}</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 shadow-lg"
        align="start"
      >
        {/* Search input - no auto-focus */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('memberPicker.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 !border !border-black/20 dark:!border-white/20"
            />
          </div>
        </div>

        {/* Members list */}
        <ScrollArea className="max-h-[250px]">
          {/* Unassign option */}
          {assigneeId && (
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-gray-100 dark:border-gray-800"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('inlineEditor.unassign')}</span>
            </button>
          )}

          {/* Members */}
          {filteredMembers.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {t('memberPicker.noMembersFound')}
            </div>
          ) : (
            filteredMembers.map((member, index) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted cursor-pointer text-left ${
                  index < filteredMembers.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`flex-1 ${member.id === assigneeId ? 'font-medium' : ''}`}>
                  {member.first_name} {member.last_name}
                </span>
                {member.id === assigneeId && (
                  <span className="text-xs text-brand shrink-0">{t('memberPicker.currentlyAssigned')}</span>
                )}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
