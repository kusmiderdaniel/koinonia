-- Add campus_id to tasks table
ALTER TABLE tasks
ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- Add index for faster queries by campus
CREATE INDEX idx_tasks_campus_id ON tasks(campus_id);

-- Add comment for documentation
COMMENT ON COLUMN tasks.campus_id IS 'Optional campus association for the task';
