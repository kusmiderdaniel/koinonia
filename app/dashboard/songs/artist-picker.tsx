'use client'

import { useState, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Plus, Search, User, X } from 'lucide-react'

interface ArtistPickerProps {
  artists: string[]
  value: string
  onChange: (artist: string) => void
  onArtistCreated?: (artist: string) => void
}

export const ArtistPicker = memo(function ArtistPicker({
  artists,
  value,
  onChange,
  onArtistCreated,
}: ArtistPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Filter artists based on search
  const filteredArtists = useMemo(() => {
    if (!search.trim()) return artists
    const searchLower = search.toLowerCase()
    return artists.filter(artist =>
      artist.toLowerCase().includes(searchLower)
    )
  }, [artists, search])

  // Check if search term exactly matches an existing artist (case-insensitive)
  const exactMatch = useMemo(() => {
    if (!search.trim()) return true
    return artists.some(artist =>
      artist.toLowerCase() === search.toLowerCase()
    )
  }, [artists, search])

  const handleSelectArtist = (artist: string) => {
    onChange(artist)
    setSearch('')
    setIsOpen(false)
  }

  const handleCreateArtist = () => {
    const newArtist = search.trim()
    if (newArtist) {
      onChange(newArtist)
      onArtistCreated?.(newArtist)
      setSearch('')
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between !border !border-black dark:!border-zinc-700"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || 'Select or add artist...'}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear(e as unknown as React.MouseEvent)
                  }
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700"
        align="start"
      >
        {/* Search Input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search or add new artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  e.preventDefault()
                  if (!exactMatch) {
                    handleCreateArtist()
                  } else if (filteredArtists.length === 1) {
                    handleSelectArtist(filteredArtists[0])
                  }
                }
              }}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
        </div>

        {/* Artist List */}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredArtists.length > 0 ? (
            <div className="p-1">
              {filteredArtists.map((artist) => (
                <button
                  key={artist}
                  type="button"
                  onClick={() => handleSelectArtist(artist)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    value === artist
                      ? 'bg-brand/10 text-brand'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {artist}
                </button>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No artists found
            </div>
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No artists yet
            </div>
          )}
        </div>

        {/* Add New Artist Option */}
        {search.trim() && !exactMatch && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={handleCreateArtist}
              className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-brand"
            >
              <Plus className="w-4 h-4" />
              Add "{search.trim()}"
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
})
