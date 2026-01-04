'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music, User, Search, AlertCircle, RefreshCw, Trash2, Save } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  updateAgendaItemSongKey,
  updateAgendaItemLeader,
  updateAgendaItemDescription,
  getMinistryMembersForAgenda,
  removeAgendaItem,
} from '../actions'
import { getUnavailabilityForDate } from '@/app/dashboard/availability/actions'

const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
]

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface UnavailabilityInfo {
  profile_id: string
  reason: string | null
}

export interface SongEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendaItemId: string
  songTitle: string
  currentKey: string | null
  currentLeaderId: string | null
  currentLeaderName: string | null
  currentDescription: string | null
  ministryId: string | null
  eventDate: string
  onSuccess: () => void
  onDataChange?: () => void
  onReplaceSong: () => void
}

export function SongEditor({
  open,
  onOpenChange,
  agendaItemId,
  songTitle,
  currentKey,
  currentLeaderId,
  currentLeaderName,
  currentDescription,
  ministryId,
  eventDate,
  onSuccess,
  onDataChange,
  onReplaceSong,
}: SongEditorProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(currentKey)
  const [selectedLeaderName, setSelectedLeaderName] = useState<string | null>(currentLeaderName)
  const [description, setDescription] = useState<string>(currentDescription || '')
  const [members, setMembers] = useState<Member[]>([])
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
  const [unavailabilityReasons, setUnavailabilityReasons] = useState<Map<string, string | null>>(new Map())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLeaderPicker, setShowLeaderPicker] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedKey(currentKey)
      setSelectedLeaderName(currentLeaderName)
      setDescription(currentDescription || '')
      setSearch('')
      setError(null)
      setShowLeaderPicker(false)
    }
  }, [open, currentKey, currentLeaderName, currentDescription])

  // Load members when showing leader picker
  useEffect(() => {
    if (open && showLeaderPicker && ministryId) {
      setIsLoading(true)
      setError(null)

      getMinistryMembersForAgenda(ministryId).then(async (result) => {
        if (result.error) {
          setError(result.error)
          setIsLoading(false)
          return
        }

        const validMembers = (result.data || []).filter((m): m is Member => m !== null)
        setMembers(validMembers)

        // Fetch unavailability
        if (validMembers.length > 0 && eventDate) {
          const profileIds = validMembers.map((m) => m.id)
          const unavailResult = await getUnavailabilityForDate(eventDate, profileIds)

          if (!unavailResult.error && unavailResult.data) {
            const unavailSet = new Set(unavailResult.data.map((u: UnavailabilityInfo) => u.profile_id))
            setUnavailableIds(unavailSet)

            const reasonsMap = new Map<string, string | null>()
            unavailResult.data.forEach((u: UnavailabilityInfo) => {
              reasonsMap.set(u.profile_id, u.reason)
            })
            setUnavailabilityReasons(reasonsMap)
          }
        }

        setIsLoading(false)
      })
    }
  }, [open, showLeaderPicker, ministryId, eventDate])

  const filteredMembers = useMemo(() => {
    if (!debouncedSearch.trim()) return members

    const searchLower = debouncedSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(searchLower) ||
        m.last_name.toLowerCase().includes(searchLower) ||
        (m.email?.toLowerCase().includes(searchLower) ?? false)
    )
  }, [members, debouncedSearch])

  // Sort members: available first, then unavailable
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aUnavailable = unavailableIds.has(a.id)
      const bUnavailable = unavailableIds.has(b.id)
      if (aUnavailable && !bUnavailable) return 1
      if (!aUnavailable && bUnavailable) return -1
      return 0
    })
  }, [filteredMembers, unavailableIds])

  const handleKeyChange = useCallback(async (key: string) => {
    const newKey = key === 'none' ? null : key
    setSelectedKey(newKey)
    setIsSaving(true)
    setError(null)

    const result = await updateAgendaItemSongKey(agendaItemId, newKey)

    if (result.error) {
      setError(result.error)
    } else {
      onDataChange?.()
    }
    setIsSaving(false)
  }, [agendaItemId, onDataChange])

  const handleLeaderChange = useCallback(async (leaderId: string | null, leaderName: string | null) => {
    setIsSaving(true)
    setError(null)

    const result = await updateAgendaItemLeader(agendaItemId, leaderId)

    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      setSelectedLeaderName(leaderName)
      setIsSaving(false)
      setShowLeaderPicker(false)
      onDataChange?.()
    }
  }, [agendaItemId, onDataChange])

  const handleRemoveClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmRemove = useCallback(async () => {
    setIsRemoving(true)
    setError(null)

    const result = await removeAgendaItem(agendaItemId)

    if (result.error) {
      setError(result.error)
      setIsRemoving(false)
      setShowDeleteConfirm(false)
    } else {
      setIsRemoving(false)
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess()
    }
  }, [agendaItemId, onOpenChange, onSuccess])

  const handleReplaceSong = useCallback(() => {
    onOpenChange(false)
    onReplaceSong()
  }, [onOpenChange, onReplaceSong])

  const handleDescriptionSave = useCallback(async () => {
    setIsSavingNotes(true)
    setError(null)

    const result = await updateAgendaItemDescription(agendaItemId, description.trim() || null)

    if (result.error) {
      setError(result.error)
    }
    setIsSavingNotes(false)
  }, [agendaItemId, description])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-600" />
            {songTitle}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
            {error}
          </div>
        )}

        {!showLeaderPicker ? (
          <>
            {/* Key Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Key</label>
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-zinc-900">
                {/* No key option */}
                <button
                  type="button"
                  onClick={() => handleKeyChange('none')}
                  disabled={isSaving}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded mb-2 transition-colors ${
                    selectedKey === null
                      ? 'bg-purple-500 text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-muted-foreground'
                  }`}
                >
                  No key
                </button>

                {/* Major keys */}
                <div className="text-xs font-semibold text-muted-foreground px-1 py-1">Major</div>
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {MUSICAL_KEYS.filter(k => !k.endsWith('m')).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeyChange(k)}
                      disabled={isSaving}
                      className={`px-1.5 py-1 text-xs rounded transition-colors ${
                        selectedKey === k
                          ? 'bg-purple-500 text-white'
                          : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Minor keys */}
                <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">Minor</div>
                <div className="grid grid-cols-6 gap-1">
                  {MUSICAL_KEYS.filter(k => k.endsWith('m')).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeyChange(k)}
                      disabled={isSaving}
                      className={`px-1.5 py-1 text-xs rounded transition-colors ${
                        selectedKey === k
                          ? 'bg-purple-500 text-white'
                          : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Leader Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Leader</label>
              <button
                type="button"
                onClick={() => setShowLeaderPicker(true)}
                disabled={!ministryId || isSaving}
                className="w-full text-left p-3 rounded-lg border border-gray-900 dark:border-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedLeaderName ? (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{selectedLeaderName}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {ministryId ? 'Select leader...' : 'No ministry assigned'}
                  </span>
                )}
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Add notes for this song..."
                className="min-h-[80px] text-sm resize-none"
                disabled={isSavingNotes}
              />
              {isSavingNotes && (
                <p className="text-xs text-muted-foreground">Saving...</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-red-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleRemoveClick}
                disabled={isSaving || isRemoving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full border-gray-900 dark:border-zinc-300"
                onClick={handleReplaceSong}
                disabled={isSaving || isRemoving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Replace
              </Button>
              <Button
                className="flex-1 rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isRemoving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Leader Picker View */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaderPicker(false)}
              className="mb-2"
            >
              ← Back
            </Button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Member List */}
            <div className="max-h-[250px] overflow-y-auto -mx-4 px-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading members...
                </p>
              ) : (
                <div className="space-y-1">
                  {/* Unassign option */}
                  <button
                    type="button"
                    onClick={() => handleLeaderChange(null, null)}
                    disabled={isSaving}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentLeaderId === null
                        ? 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="text-muted-foreground italic">Not assigned</span>
                  </button>

                  {sortedMembers.length === 0 && !isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {members.length === 0
                        ? 'No members in this ministry'
                        : 'No members found matching your search'}
                    </p>
                  ) : (
                    sortedMembers.map((member) => {
                      const isUnavailable = unavailableIds.has(member.id)
                      const reason = unavailabilityReasons.get(member.id)

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => !isUnavailable && handleLeaderChange(member.id, `${member.first_name} ${member.last_name}`)}
                          disabled={isSaving || isUnavailable}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isUnavailable
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 cursor-not-allowed opacity-75'
                              : currentLeaderId === member.id
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={isUnavailable ? 'text-red-700 dark:text-red-400' : ''}>
                              <div className="font-medium">
                                {member.first_name} {member.last_name}
                              </div>
                            </div>
                            {isUnavailable && (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs">Unavailable</span>
                              </div>
                            )}
                          </div>
                          {isUnavailable && reason && (
                            <div className="text-xs text-red-600 dark:text-red-500 mt-1 italic">
                              {reason}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Remove Song?"
      description={
        <>
          Are you sure you want to remove <strong>{songTitle}</strong> from the agenda?
        </>
      }
      confirmLabel="Remove"
      destructive
      isLoading={isRemoving}
      onConfirm={handleConfirmRemove}
    />
  </>
  )
}
