import { z } from 'zod'

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
export type TaskStatus = z.infer<typeof taskStatusSchema>

// Task priority enum
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export type TaskPriority = z.infer<typeof taskPrioritySchema>

// Task activity type enum
export const taskActivityTypeSchema = z.enum([
  'comment',
  'created',
  'assigned',
  'status_changed',
  'priority_changed',
  'due_date_changed',
  'completed',
  'reopened',
])
export type TaskActivityType = z.infer<typeof taskActivityTypeSchema>

// Schema for creating/updating a task
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().uuid('Invalid assignee').optional().nullable(),
  status: taskStatusSchema.default('pending'),
  priority: taskPrioritySchema.default('medium'),
  eventId: z.string().uuid('Invalid event').optional().nullable(),
  ministryId: z.string().uuid('Invalid ministry').optional().nullable(),
  campusId: z.string().uuid('Invalid campus').optional().nullable(),
})

export type TaskInput = z.infer<typeof taskSchema>

// Schema for updating task status only
export const taskStatusUpdateSchema = z.object({
  status: taskStatusSchema,
})

export type TaskStatusUpdate = z.infer<typeof taskStatusUpdateSchema>

// Schema for task comments
export const taskCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment must be 2000 characters or less'),
})

export type TaskCommentInput = z.infer<typeof taskCommentSchema>

// Schema for filtering tasks
export const taskFilterSchema = z.object({
  status: z.array(taskStatusSchema).optional(),
  priority: z.array(taskPrioritySchema).optional(),
  assignedTo: z.string().uuid().optional(),
  ministryId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  search: z.string().optional(),
})

export type TaskFilters = z.infer<typeof taskFilterSchema>
