'use client'

import { useState, memo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X, Search, Check } from 'lucide-react'
import type { InviteUsersPickerProps } from './types'

export const InviteUsersPicker = memo(function InviteUsersPicker({
  invitedUsers,
  setInvitedUsers,
  churchMembers,
}: InviteUsersPickerProps) {
  const [invitePickerOpen, setInvitePickerOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const debouncedInviteSearch = useDebouncedValue(inviteSearch, 300)

  return (
    <div className="space-y-2">
      <Label>Invite Users</Label>
      <Popover open={invitePickerOpen} onOpenChange={setInvitePickerOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="flex w-full items-start justify-start text-left h-auto min-h-10 py-2 px-3 border border-input rounded-md bg-white dark:bg-zinc-950 hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setInvitePickerOpen(true)
              }
            }}
          >
            {invitedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {invitedUsers.map((userId) => {
                  const user = churchMembers.find((m) => m.id === userId)
                  return user ? (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-full text-sm"
                    >
                      {user.first_name} {user.last_name}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          setInvitedUsers(invitedUsers.filter((id) => id !== userId))
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            setInvitedUsers(invitedUsers.filter((id) => id !== userId))
                          }
                        }}
                        className="hover:text-destructive cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </span>
                  ) : null
                })}
              </div>
            ) : (
              <span className="text-muted-foreground">Select users to invite...</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-2 bg-white dark:bg-zinc-950 border"
          align="start"
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-input rounded-lg p-1">
              {churchMembers
                .filter((member) =>
                  `${member.first_name} ${member.last_name}`
                    .toLowerCase()
                    .includes(debouncedInviteSearch.toLowerCase())
                )
                .map((member) => {
                  const isSelected = invitedUsers.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setInvitedUsers(invitedUsers.filter((id) => id !== member.id))
                        } else {
                          setInvitedUsers([...invitedUsers, member.id])
                        }
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-zinc-800'
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-input'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.email && (
                          <div className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              {churchMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members found
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {invitedUsers.length === 0 && (
        <p className="text-xs text-amber-600">
          Private events require at least one invited user
        </p>
      )}
    </div>
  )
})
