import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'

// Re-export auth utilities
export { getAuthenticatedUserWithProfile, isAuthError, requireAdminPermission, requireManagePermission }

// Re-export validation schemas and types
export {
  taskSchema,
  taskStatusSchema,
  taskPrioritySchema,
  taskCommentSchema,
  taskFilterSchema,
  type TaskInput,
  type TaskStatus,
  type TaskPriority,
  type TaskCommentInput,
  type TaskFilters,
} from '@/lib/validations/tasks'
