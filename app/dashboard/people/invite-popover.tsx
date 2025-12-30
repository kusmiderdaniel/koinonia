'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface InvitePopoverProps {
  joinCode: string
}

export function InvitePopover({ joinCode }: InvitePopoverProps) {
  const [copied, setCopied] = useState(false)

  const copyJoinCode = async () => {
    await navigator.clipboard.writeText(joinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="!border !border-gray-300">
          Invite Members
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 border border-black dark:border-zinc-700">
        <div className="space-y-3">
          <div className="text-sm font-medium">Church Join Code</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 py-2 px-3 bg-muted rounded-lg border border-black/10 dark:border-zinc-700 text-center">
              <span className="text-lg font-mono font-bold tracking-[0.2em]">
                {joinCode}
              </span>
            </div>
            <Button
              onClick={copyJoinCode}
              variant="outline-pill"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with new members to join your church.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
