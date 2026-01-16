'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface MobileBackHeaderProps {
  title?: string
  onBack: () => void
}

export function MobileBackHeader({ title, onBack }: MobileBackHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={onBack} className="min-h-11 min-w-11" aria-label="Go back">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      {title && <h2 className="font-semibold text-lg truncate">{title}</h2>}
    </div>
  )
}
