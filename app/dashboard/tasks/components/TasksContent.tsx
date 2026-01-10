'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'
import { TasksTable } from './TasksTable'
import { TaskCard } from './TaskCard'
import { useIsMobile } from '@/lib/hooks'
import type { Task, TaskMinistry, TaskCampus, Person, TaskStatus, TaskPriority } from '../types'

interface TaskGroup {
  id: string
  label: string
  color?: string | null
  tasks: Task[]
}

interface TasksContentProps {
  tasks: Task[]
  groups: TaskGroup[]
  showGroupHeaders: boolean
  isMobile: boolean

  // Data for table
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  selectedTaskId: string | null
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Handlers
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

  // Mobile-specific handlers (sync versions)
  onMobileStatusChange?: (taskId: string, status: TaskStatus) => void
}

export function TasksContent({
  tasks,
  groups,
  showGroupHeaders,
  isMobile,
  ministries,
  campuses,
  members,
  selectedTaskId,
  weekStartsOn,
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
  onMobileStatusChange,
}: TasksContentProps) {
  if (isMobile) {
    return (
      <Card className="flex-1 overflow-hidden border rounded-lg">
        <ScrollArea className="h-full">
          {tasks.length === 0 ? (
            <EmptyState onCreateTask={onCreateTask} />
          ) : showGroupHeaders ? (
            <GroupedMobileView
              groups={groups}
              selectedTaskId={selectedTaskId}
              onTitleClick={onTitleClick}
              onStatusChange={onMobileStatusChange || ((id, status) => onStatusChange(id, status))}
              onCompletionToggle={onCompletionToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <FlatMobileView
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onTitleClick={onTitleClick}
              onStatusChange={onMobileStatusChange || ((id, status) => onStatusChange(id, status))}
              onCompletionToggle={onCompletionToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </ScrollArea>
      </Card>
    )
  }

  return (
    <Card className="flex-1 overflow-auto border rounded-lg">
      <TasksTable
        tasks={tasks}
        groups={groups}
        showGroupHeaders={showGroupHeaders}
        ministries={ministries}
        campuses={campuses}
        members={members}
        selectedTaskId={selectedTaskId}
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
        onCreateTask={onCreateTask}
        weekStartsOn={weekStartsOn}
      />
    </Card>
  )
}

function EmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()

  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${isMobile ? 'py-8' : 'py-16'}`}>
      <div className={`text-muted-foreground ${isMobile ? 'text-sm mb-3' : 'mb-4'}`}>{t('noTasksFound')}</div>
      <Button onClick={onCreateTask} variant="outline" size={isMobile ? 'sm' : 'default'} className="!border !border-black dark:!border-white rounded-full">
        <Plus className={isMobile ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-2'} />
        {t('createFirstTask')}
      </Button>
    </div>
  )
}

interface MobileViewProps {
  selectedTaskId: string | null
  onTitleClick: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onCompletionToggle: (taskId: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function GroupedMobileView({
  groups,
  ...props
}: MobileViewProps & { groups: TaskGroup[] }) {
  const isMobile = useIsMobile()

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id}>
          <div className={`sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
            <div className={`flex items-center gap-2 font-medium ${isMobile ? 'text-sm' : ''}`}>
              {group.color && (
                <span
                  className={`rounded-full ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
                  style={{ backgroundColor: group.color }}
                />
              )}
              <span>{group.label}</span>
              <span className={`text-muted-foreground font-normal ${isMobile ? 'text-xs' : 'text-sm'}`}>
                ({group.tasks.length})
              </span>
            </div>
          </div>
          {group.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={task.id === props.selectedTaskId}
              onTitleClick={props.onTitleClick}
              onStatusChange={props.onStatusChange}
              onCompletionToggle={props.onCompletionToggle}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function FlatMobileView({
  tasks,
  ...props
}: MobileViewProps & { tasks: Task[] }) {
  return (
    <div>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={task.id === props.selectedTaskId}
          onTitleClick={props.onTitleClick}
          onStatusChange={props.onStatusChange}
          onCompletionToggle={props.onCompletionToggle}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />
      ))}
    </div>
  )
}
