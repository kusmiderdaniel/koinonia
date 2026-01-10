'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { InlineStatusEditor } from './InlineStatusEditor'
import { InlinePriorityEditor } from './InlinePriorityEditor'
import { InlineMinistryEditor } from './InlineMinistryEditor'
import { InlineCampusEditor } from './InlineCampusEditor'
import { InlineAssigneeEditor } from './InlineAssigneeEditor'
import { InlineDueDateEditor } from './InlineDueDateEditor'
import type { Task, TaskMinistry, TaskCampus, TaskStatus, TaskPriority, Person } from '../types'

interface TaskRowProps {
  task: Task
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  isSelected: boolean
  onTitleClick: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
  onPriorityChange: (taskId: string, priority: TaskPriority) => Promise<void>
  onAssigneeChange: (taskId: string, assigneeId: string | null) => Promise<void>
  onMinistryChange: (taskId: string, ministryId: string | null) => Promise<void>
  onCampusChange: (taskId: string, campusId: string | null) => Promise<void>
  onDueDateChange: (taskId: string, dueDate: Date | null) => Promise<void>
  onCompletionToggle: (taskId: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export const TaskRow = memo(function TaskRow({
  task,
  ministries,
  campuses,
  members,
  isSelected,
  onTitleClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onMinistryChange,
  onCampusChange,
  onDueDateChange,
  onCompletionToggle,
  onEdit,
  onDelete,
  weekStartsOn,
}: TaskRowProps) {
  const t = useTranslations('tasks')
  const isCompleted = task.status === 'completed'

  return (
    <TableRow
      className={isSelected ? 'bg-muted' : ''}
    >
      {/* Checkbox for completion */}
      <TableCell className="w-[40px]">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onCompletionToggle(task.id, checked as boolean)}
          className="h-5 w-5"
        />
      </TableCell>

      {/* Title - clickable to open detail sheet */}
      <TableCell className="min-w-[200px]">
        <button
          onClick={() => onTitleClick(task.id)}
          className={`text-left font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded ${
            isCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </button>
      </TableCell>

      {/* Status */}
      <TableCell className="w-[120px]">
        <InlineStatusEditor
          status={task.status}
          onUpdate={(status) => onStatusChange(task.id, status)}
        />
      </TableCell>

      {/* Priority */}
      <TableCell className="w-[100px]">
        <InlinePriorityEditor
          priority={task.priority}
          onUpdate={(priority) => onPriorityChange(task.id, priority)}
        />
      </TableCell>

      {/* Assignee */}
      <TableCell className="w-[150px]">
        <InlineAssigneeEditor
          assigneeId={task.assigned_to}
          assignee={task.assignee}
          members={members}
          onUpdate={(assigneeId) => onAssigneeChange(task.id, assigneeId)}
        />
      </TableCell>

      {/* Ministry */}
      <TableCell className="w-[130px]">
        <InlineMinistryEditor
          ministryId={task.ministry_id}
          ministry={task.ministry}
          ministries={ministries}
          onUpdate={(ministryId) => onMinistryChange(task.id, ministryId)}
        />
      </TableCell>

      {/* Campus */}
      <TableCell className="w-[130px]">
        <InlineCampusEditor
          campusId={task.campus_id}
          campus={task.campus}
          campuses={campuses}
          onUpdate={(campusId) => onCampusChange(task.id, campusId)}
        />
      </TableCell>

      {/* Due Date */}
      <TableCell className="w-[120px]">
        <InlineDueDateEditor
          dueDate={task.due_date}
          onUpdate={(date) => onDueDateChange(task.id, date)}
          weekStartsOn={weekStartsOn}
        />
      </TableCell>

      {/* Actions */}
      <TableCell className="w-[50px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})
