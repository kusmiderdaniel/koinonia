// Re-export all task CRUD actions from the split files
// This file is kept for backwards compatibility

export {
  // Queries
  getTasks,
  getTask,
  getTasksForEvent,
  getMyTasks,
  // Mutations
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from './tasks/index'
