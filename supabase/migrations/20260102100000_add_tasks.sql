-- Tasks feature: Create tasks and task_comments tables for church task management

-- =============================================================================
-- 1. Create tasks table
-- =============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,

  -- Assignment (single person)
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status and priority
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Optional relationships
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Create task_comments table (comments and activity log)
-- =============================================================================

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Activity type for the log
  activity_type TEXT NOT NULL DEFAULT 'comment' CHECK (activity_type IN (
    'comment',           -- User comment
    'created',           -- Task created
    'assigned',          -- Assignment changed
    'status_changed',    -- Status updated
    'priority_changed',  -- Priority updated
    'due_date_changed',  -- Due date modified
    'completed',         -- Task marked complete
    'reopened'           -- Task reopened
  )),

  -- For activity tracking (optional metadata)
  old_value TEXT,
  new_value TEXT,

  -- Author
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. Create indexes for tasks
-- =============================================================================

CREATE INDEX idx_tasks_church_id ON tasks(church_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_event_id ON tasks(event_id);
CREATE INDEX idx_tasks_ministry_id ON tasks(ministry_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Compound index for common queries (all tasks in a church by status and due date)
CREATE INDEX idx_tasks_church_status_due ON tasks(church_id, status, due_date);

-- =============================================================================
-- 4. Create indexes for task_comments
-- =============================================================================

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_author_id ON task_comments(author_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);
CREATE INDEX idx_task_comments_activity_type ON task_comments(activity_type);

-- =============================================================================
-- 5. Enable RLS
-- =============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. RLS policies for tasks
-- =============================================================================

-- All church members can view tasks in their church
CREATE POLICY "Users can view tasks in their church"
  ON tasks FOR SELECT
  USING (church_id = get_user_church_id());

-- All church members can create tasks (open access per requirements)
CREATE POLICY "Users can create tasks for their church"
  ON tasks FOR INSERT
  WITH CHECK (church_id = get_user_church_id());

-- Users can update tasks they created, are assigned to, or if they are admin/leader
CREATE POLICY "Users can update tasks they have access to"
  ON tasks FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND (
      created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'leader')
      )
    )
  );

-- Creators or admins can delete tasks
CREATE POLICY "Users can delete tasks they created or admins"
  ON tasks FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
      )
    )
  );

-- =============================================================================
-- 7. RLS policies for task_comments
-- =============================================================================

-- View comments for tasks in the user's church
CREATE POLICY "Users can view comments for church tasks"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE church_id = get_user_church_id()
    )
  );

-- All church members can add comments to tasks in their church
CREATE POLICY "Users can add comments to church tasks"
  ON task_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND task_id IN (
      SELECT id FROM tasks WHERE church_id = get_user_church_id()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (author_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (author_id = auth.uid());

-- =============================================================================
-- 8. Add updated_at trigger for tasks
-- =============================================================================

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. Extend notifications table for task notifications
-- =============================================================================

-- Add task_id column to notifications table
ALTER TABLE notifications
  ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create index for task_id
CREATE INDEX idx_notifications_task_id ON notifications(task_id);

-- Drop existing type constraint and add new one with task notification types
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'position_invitation',
    'assignment_reminder',
    'event_update',
    'general',
    'task_assignment',      -- When assigned to a task
    'task_due_reminder',    -- 1 day before due date
    'task_comment'          -- When someone comments on your task
  ));
