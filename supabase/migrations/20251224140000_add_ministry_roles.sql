-- Create ministry_roles table for defining roles within each ministry
CREATE TABLE ministry_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique role names within a ministry
  UNIQUE(ministry_id, name)
);

-- Create ministry_members table for assigning people to ministries with roles
CREATE TABLE ministry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES ministry_roles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  -- A person can only have one role per ministry
  UNIQUE(ministry_id, profile_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_ministry_roles_ministry_id ON ministry_roles(ministry_id);
CREATE INDEX idx_ministry_members_ministry_id ON ministry_members(ministry_id);
CREATE INDEX idx_ministry_members_profile_id ON ministry_members(profile_id);
CREATE INDEX idx_ministry_members_role_id ON ministry_members(role_id);

-- Enable RLS
ALTER TABLE ministry_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for ministry_roles
CREATE POLICY "Users can view ministry roles in their church"
  ON ministry_roles FOR SELECT
  USING (
    ministry_id IN (
      SELECT m.id FROM ministries m
      WHERE m.church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage ministry roles"
  ON ministry_roles FOR ALL
  USING (
    ministry_id IN (
      SELECT m.id FROM ministries m
      WHERE m.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin', 'leader')
    )
  );

-- RLS policies for ministry_members
CREATE POLICY "Users can view ministry members in their church"
  ON ministry_members FOR SELECT
  USING (
    ministry_id IN (
      SELECT m.id FROM ministries m
      WHERE m.church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage ministry members"
  ON ministry_members FOR ALL
  USING (
    ministry_id IN (
      SELECT m.id FROM ministries m
      WHERE m.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin', 'leader')
    )
  );

-- Add updated_at trigger for ministry_roles
CREATE TRIGGER update_ministry_roles_updated_at
  BEFORE UPDATE ON ministry_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
