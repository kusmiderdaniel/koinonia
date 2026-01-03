'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Trash2, X } from 'lucide-react'
import type { Task } from './types'

interface TaskDetailHeaderProps {
  task: Task
  onTitleChange: (title: string) => Promise<void>
  onDelete?: () => void
  onClose: () => void
  canDelete: boolean
}

export function TaskDetailHeader({
  task,
  onTitleChange,
  onDelete,
  onClose,
  canDelete,
}: TaskDetailHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const startEditingTitle = useCallback(() => {
    setTitleValue(task.title)
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }, [task.title])

  const saveTitleEdit = useCallback(() => {
    if (titleValue.trim() && titleValue !== task.title) {
      onTitleChange(titleValue.trim())
    }
    setEditingTitle(false)
  }, [task.title, titleValue, onTitleChange])

  const cancelTitleEdit = useCallback(() => {
    setEditingTitle(false)
    setTitleValue(task.title)
  }, [task.title])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTitleEdit()
    } else if (e.key === 'Escape') {
      cancelTitleEdit()
    }
  }, [saveTitleEdit, cancelTitleEdit])

  return (
    <SheetHeader className="!p-0 pb-0">
      <div className="flex items-center justify-between gap-2 w-full">
        {editingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={handleTitleKeyDown}
            className="font-semibold text-lg h-8 flex-1"
          />
        ) : (
          <SheetTitle
            className="text-left flex-1 cursor-pointer hover:bg-muted/50 rounded py-1 transition-colors"
            onClick={startEditingTitle}
          >
            {task.title}
          </SheetTitle>
        )}
        <div className="flex items-center gap-0 shrink-0">
          {onDelete && canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SheetHeader>
  )
}
