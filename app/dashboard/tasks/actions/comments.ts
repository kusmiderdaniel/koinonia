'use server'

import { revalidatePath } from 'next/cache'
import {
  taskCommentSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  type TaskCommentInput,
} from './helpers'

const COMMENT_SELECT = `
  *,
  author:profiles!author_id (
    id,
    first_name,
    last_name,
    email
  )
`

export async function getTaskComments(taskId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify task belongs to user's church
  const { data: task } = await adminClient
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('church_id', profile.church_id)
    .single()

  if (!task) {
    return { error: 'Task not found' }
  }

  const { data: comments, error } = await adminClient
    .from('task_comments')
    .select(COMMENT_SELECT)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return { error: 'Failed to load comments' }
  }

  return { data: comments || [] }
}

export async function addComment(taskId: string, data: TaskCommentInput) {
  const validated = taskCommentSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid comment' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Verify task belongs to user's church
  const { data: task } = await adminClient
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('church_id', profile.church_id)
    .single()

  if (!task) {
    return { error: 'Task not found' }
  }

  const { data: comment, error } = await adminClient
    .from('task_comments')
    .insert({
      task_id: taskId,
      content: validated.data.content,
      activity_type: 'comment',
      author_id: profile.id,
    })
    .select(COMMENT_SELECT)
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return { error: 'Failed to add comment' }
  }

  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { data: comment }
}

export async function updateComment(commentId: string, data: TaskCommentInput) {
  const validated = taskCommentSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid comment' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, adminClient } = auth

  // Check if user owns the comment
  const { data: existingComment } = await adminClient
    .from('task_comments')
    .select('author_id, task_id, activity_type')
    .eq('id', commentId)
    .single()

  if (!existingComment) {
    return { error: 'Comment not found' }
  }

  if (existingComment.author_id !== user.id) {
    return { error: 'You can only edit your own comments' }
  }

  // Only allow editing of actual comments, not activity logs
  if (existingComment.activity_type !== 'comment') {
    return { error: 'Activity entries cannot be edited' }
  }

  const { data: comment, error } = await adminClient
    .from('task_comments')
    .update({ content: validated.data.content })
    .eq('id', commentId)
    .select(COMMENT_SELECT)
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    return { error: 'Failed to update comment' }
  }

  revalidatePath(`/dashboard/tasks/${existingComment.task_id}`)
  return { data: comment }
}

export async function deleteComment(commentId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, adminClient } = auth

  // Check if user owns the comment
  const { data: comment } = await adminClient
    .from('task_comments')
    .select('author_id, task_id, activity_type')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return { error: 'Comment not found' }
  }

  if (comment.author_id !== user.id) {
    return { error: 'You can only delete your own comments' }
  }

  // Only allow deleting of actual comments, not activity logs
  if (comment.activity_type !== 'comment') {
    return { error: 'Activity entries cannot be deleted' }
  }

  const { error } = await adminClient
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return { error: 'Failed to delete comment' }
  }

  revalidatePath(`/dashboard/tasks/${comment.task_id}`)
  return { success: true }
}
