'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, Mail } from 'lucide-react'
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
  const t = useTranslations('people')
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Delay render until mounted to avoid hydration mismatch with Radix IDs
  useEffect(() => {
    setMounted(true)
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  const copyJoinCode = async () => {
    await navigator.clipboard.writeText(joinCode)
    setCopied(true)
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  // Render placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" className="gap-2 justify-center !border !border-black/20 dark:!border-white/20">
        <Mail className="h-4 w-4" />
        {t('invite.button')}
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 justify-center !border !border-black/20 dark:!border-white/20">
          <Mail className="h-4 w-4" />
          {t('invite.button')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 shadow-lg">
        <div className="space-y-3">
          <div className="text-sm font-medium">{t('invite.title')}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 py-2 px-3 bg-muted rounded-lg border border-black/20 dark:border-white/20 text-center">
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
            {t('invite.description')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
