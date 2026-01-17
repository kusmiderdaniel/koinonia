'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { addComment } from '@/app/dashboard/tasks/actions'
import type { Task, TaskComment } from './types'

interface TaskActivityTabProps {
  task: Task
  comments: TaskComment[]
  isLoadingComments: boolean
  onCommentAdded: (comment: TaskComment) => void
}

export function TaskActivityTab({
  task,
  comments,
  isLoadingComments,
  onCommentAdded,
}: TaskActivityTabProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const handleSubmitComment = useCallback(async () => {
    if (!task || !newComment.trim()) return

    setIsSubmitting(true)
    const result = await addComment(task.id, { content: newComment.trim() })
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      onCommentAdded(result.data as TaskComment)
      setNewComment('')
    }
  }, [task, newComment, onCommentAdded])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmitComment()
    }
  }, [handleSubmitComment])

  return (
    <div className="mt-2">
      {/* Comments/Activity */}
      <div className="space-y-4">
        {/* Comment input at top */}
        <div className="space-y-4 pb-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (⌘+Enter to send)"
            rows={2}
            className="resize-none !border-black/20 dark:!border-white/20"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="!bg-brand hover:!bg-brand/90 !text-black !border !border-black/20 dark:!border-white/20"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Sending...' : 'Comment'}
            </Button>
          </div>
        </div>
        <div className="border-b border-black/20 dark:border-white/20 -mx-6" />

        {isLoadingComments ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Loading activity...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No activity yet
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {comment.author
                      ? getInitials(comment.author.first_name, comment.author.last_name)
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author
                        ? `${comment.author.first_name} ${comment.author.last_name}`
                        : 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    comment.activity_type !== 'comment' ? 'text-muted-foreground italic' : ''
                  }`}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
