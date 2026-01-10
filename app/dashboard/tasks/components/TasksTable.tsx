'use client'

import { memo, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskRow } from './TaskRow'
import type { Task, TaskMinistry, TaskCampus, TaskStatus, TaskPriority, Person } from '../types'
import type { TaskGroup } from '../group-logic'

interface TasksTableProps {
  tasks: Task[]
  groups: TaskGroup[]
  showGroupHeaders: boolean
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  selectedTaskId: string | null
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
  onCreateTask: () => void
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export const TasksTable = memo(function TasksTable({
  tasks,
  groups,
  showGroupHeaders,
  ministries,
  campuses,
  members,
  selectedTaskId,
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
  onCreateTask,
  weekStartsOn,
}: TasksTableProps) {
  const t = useTranslations('tasks')

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-muted-foreground mb-4">{t('noTasksFound')}</div>
        <Button onClick={onCreateTask} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t('createFirstTask')}
        </Button>
      </div>
    )
  }

  return (
    <Table className="min-w-[1000px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead className="min-w-[200px]">{t('columns.title')}</TableHead>
          <TableHead className="w-[120px]">{t('columns.status')}</TableHead>
          <TableHead className="w-[100px]">{t('columns.priority')}</TableHead>
          <TableHead className="w-[150px]">{t('columns.assignee')}</TableHead>
          <TableHead className="w-[130px]">{t('columns.ministry')}</TableHead>
          <TableHead className="w-[130px]">{t('columns.campus')}</TableHead>
          <TableHead className="w-[120px]">{t('columns.dueDate')}</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {showGroupHeaders ? (
          // Grouped rendering
          groups.map((group) => (
            <Fragment key={group.id}>
              {/* Group header row */}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={9} className="py-2">
                  <div className="flex items-center gap-2 font-medium">
                    {group.color && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    <span>{group.label}</span>
                    <span className="text-muted-foreground font-normal text-sm">
                      ({t('taskCount', { count: group.tasks.length })})
                    </span>
                  </div>
                </TableCell>
              </TableRow>
              {/* Tasks in this group */}
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  ministries={ministries}
                  campuses={campuses}
                  members={members}
                  isSelected={task.id === selectedTaskId}
                  onTitleClick={onTitleClick}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                  onAssigneeChange={onAssigneeChange}
                  onMinistryChange={onMinistryChange}
                  onCampusChange={onCampusChange}
                  onDueDateChange={onDueDateChange}
                  onCompletionToggle={onCompletionToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  weekStartsOn={weekStartsOn}
                />
              ))}
            </Fragment>
          ))
        ) : (
          // Flat rendering (no grouping)
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              ministries={ministries}
              campuses={campuses}
              members={members}
              isSelected={task.id === selectedTaskId}
              onTitleClick={onTitleClick}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onAssigneeChange={onAssigneeChange}
              onMinistryChange={onMinistryChange}
              onCampusChange={onCampusChange}
              onDueDateChange={onDueDateChange}
              onCompletionToggle={onCompletionToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              weekStartsOn={weekStartsOn}
            />
          ))
        )}
      </TableBody>
    </Table>
  )
})
