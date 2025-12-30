-- Migration to support multiple roles per ministry member
-- Change from single role_id on ministry_members to junction table

-- Create junction table for many-to-many relationship
CREATE TABLE ministry_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES ministry_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  -- A member can only have each role once
  UNIQUE(member_id, role_id)
);

-- Create indexes for performance
CREATE INDEX idx_ministry_member_roles_member_id ON ministry_member_roles(member_id);
CREATE INDEX idx_ministry_member_roles_role_id ON ministry_member_roles(role_id);

-- Enable RLS
ALTER TABLE ministry_member_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for ministry_member_roles
CREATE POLICY "Users can view ministry member roles in their church"
  ON ministry_member_roles FOR SELECT
  USING (
    member_id IN (
      SELECT mm.id FROM ministry_members mm
      JOIN ministries m ON mm.ministry_id = m.id
      WHERE m.church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage ministry member roles"
  ON ministry_member_roles FOR ALL
  USING (
    member_id IN (
      SELECT mm.id FROM ministry_members mm
      JOIN ministries m ON mm.ministry_id = m.id
      WHERE m.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin', 'leader')
    )
  );

-- Migrate existing role assignments to junction table
INSERT INTO ministry_member_roles (member_id, role_id)
SELECT id, role_id FROM ministry_members WHERE role_id IS NOT NULL;

-- Drop the old role_id column and its index
DROP INDEX IF EXISTS idx_ministry_members_role_id;
ALTER TABLE ministry_members DROP COLUMN role_id;
