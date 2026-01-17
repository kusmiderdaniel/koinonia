'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTaskComments } from '@/app/dashboard/tasks/actions'
import { useIsMobile } from '@/lib/hooks'
import { TaskDetailHeader } from './TaskDetailHeader'
import { TaskDetailsTab } from './TaskDetailsTab'
import { TaskActivityTab } from './TaskActivityTab'
import { useTaskHandlers } from './useTaskHandlers'
import type { TaskDetailSheetProps, TaskComment } from './types'

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onDelete,
  members = [],
  ministries = [],
  campuses = [],
  weekStartsOn = 0,
  canDelete = true,
}: TaskDetailSheetProps) {
  const t = useTranslations('tasks.details')
  const isMobile = useIsMobile()
  const [comments, setComments] = useState<TaskComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [descriptionValue, setDescriptionValue] = useState('')

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setDescriptionValue(task.description || '')
    }
  }, [task?.description])

  // Load comments when task changes
  useEffect(() => {
    if (task && open) {
      setIsLoadingComments(true)
      getTaskComments(task.id).then((result) => {
        if (result.data) {
          setComments(result.data)
        }
        setIsLoadingComments(false)
      })
    }
  }, [task?.id, open])

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when sheet closes
      setActiveTab('details')
    }
  }, [open])

  const handlers = useTaskHandlers({
    task,
    descriptionValue,
    onTaskUpdated,
  })

  const handleCommentAdded = (comment: TaskComment) => {
    setComments((prev) => [comment, ...prev])
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`overflow-y-auto bg-white dark:bg-zinc-950 ${
          isMobile ? 'px-4 pt-3' : 'w-full sm:max-w-lg px-6 pt-4'
        }`}
        showCloseButton={false}
        fullScreen={isMobile}
      >
        <TaskDetailHeader
          task={task}
          onTitleChange={handlers.handleTitleChange}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
          canDelete={canDelete}
        />
        <div className="border-b border-black/20 dark:border-white/20 -mx-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="-mt-2">
          <TabsList className="grid w-full grid-cols-2 my-2 -mx-6 px-6" style={{ width: 'calc(100% + 3rem)' }}>
            <TabsTrigger value="details" className="data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground">
              {t('tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground">
              {t('tabs.activity')}
            </TabsTrigger>
          </TabsList>
          <div className="border-b border-black/20 dark:border-white/20 -mx-6" />

          <TabsContent value="details">
            <TaskDetailsTab
              task={task}
              members={members}
              ministries={ministries}
              campuses={campuses}
              weekStartsOn={weekStartsOn}
              descriptionValue={descriptionValue}
              onDescriptionChange={setDescriptionValue}
              handlers={handlers}
            />
          </TabsContent>

          <TabsContent value="activity">
            <TaskActivityTab
              task={task}
              comments={comments}
              isLoadingComments={isLoadingComments}
              onCommentAdded={handleCommentAdded}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
