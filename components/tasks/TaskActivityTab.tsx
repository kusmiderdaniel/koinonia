'use client'

import { useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
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
  const t = useTranslations('tasks.details.activity')
  const locale = useLocale()
  const dateLocale = locale === 'pl' ? pl : enUS
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const getActivityMessage = (comment: TaskComment): string => {
    // User comments are displayed as-is
    if (comment.activity_type === 'comment') {
      return comment.content
    }

    // System activities are translated
    switch (comment.activity_type) {
      case 'created':
        return t('messages.created')
      case 'completed':
        return t('messages.completed')
      case 'reopened':
        return t('messages.reopened')
      case 'assigned':
        return comment.new_value === 'Unassigned'
          ? t('messages.assigneeRemoved')
          : t('messages.assigned')
      case 'status_changed':
        return t('messages.statusChanged', { oldValue: comment.old_value, newValue: comment.new_value })
      case 'priority_changed':
        return t('messages.priorityChanged', { oldValue: comment.old_value, newValue: comment.new_value })
      case 'due_date_changed':
        return t('messages.dueDateChanged')
      default:
        return t('messages.updated')
    }
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
            placeholder={t('placeholder')}
            rows={2}
            className="resize-none !border-black/20 dark:!border-white/20"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="!bg-brand hover:!bg-brand/90 !text-white dark:!text-black !border !border-black/20 dark:!border-white/20"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? t('sending') : t('comment')}
            </Button>
          </div>
        </div>
        <div className="border-b border-black/20 dark:border-white/20 -mx-6" />

        {isLoadingComments ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t('loading')}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t('noActivity')}
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
                        : t('unknown')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    comment.activity_type !== 'comment' ? 'text-muted-foreground italic' : ''
                  }`}>
                    {getActivityMessage(comment)}
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
