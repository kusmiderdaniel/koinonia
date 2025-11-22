-- =====================================================
-- MULTI-CHURCH SUPPORT
-- =====================================================
-- This migration adds support for users to be members of multiple churches
-- Changes:
-- 1. Creates church_members junction table
-- 2. Keeps church_id on profiles as "active/current" church
-- 3. Updates church creation to add membership records
-- 4. Adds RLS policies for the new table

-- =====================================================
-- CREATE CHURCH_MEMBERS TABLE
-- =====================================================

CREATE TABLE church_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

-- Add indexes
CREATE INDEX church_members_user_id_idx ON church_members(user_id);
CREATE INDEX church_members_church_id_idx ON church_members(church_id);
CREATE INDEX church_members_role_idx ON church_members(role);

-- Add trigger for updated_at
CREATE TRIGGER church_members_updated_at
  BEFORE UPDATE ON church_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE church_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view their own church memberships"
  ON church_members FOR SELECT
  USING (user_id = auth.uid());

-- Users can view memberships of people in their churches
CREATE POLICY "Users can view memberships in their churches"
  ON church_members FOR SELECT
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

-- Users can insert their own memberships (for joining churches)
CREATE POLICY "Users can join churches"
  ON church_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Church owners/admins can update memberships in their church
CREATE POLICY "Admins can update memberships in their church"
  ON church_members FOR UPDATE
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Church owners/admins can delete memberships in their church (except their own if they're the only owner)
CREATE POLICY "Admins can remove members from their church"
  ON church_members FOR DELETE
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
    AND NOT (
      -- Prevent removing the last owner
      role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM church_members cm2
        WHERE cm2.church_id = church_members.church_id
        AND cm2.role = 'owner'
        AND cm2.user_id != church_members.user_id
      )
    )
  );

-- =====================================================
-- UPDATE CHURCH CREATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_church_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  church_id UUID,
  church_name TEXT,
  church_slug TEXT,
  invite_code TEXT
) AS $$
DECLARE
  v_church_id UUID;
  v_invite_code TEXT;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if slug already exists
  IF EXISTS (
    SELECT 1 FROM public.churches
    WHERE churches.slug = p_slug
  ) THEN
    RAISE EXCEPTION 'A church with this name already exists. Please choose a different name.';
  END IF;

  -- Generate unique invite code
  v_invite_code := generate_unique_invite_code();

  -- Insert the new church
  INSERT INTO public.churches (
    name, slug, email, phone, address, city, state, zip_code,
    invite_code, invite_code_generated_at
  )
  VALUES (
    p_name, p_slug, p_email, p_phone, p_address, p_city, p_state, p_zip_code,
    v_invite_code, NOW()
  )
  RETURNING id INTO v_church_id;

  -- Add user as owner in church_members table
  INSERT INTO public.church_members (user_id, church_id, role)
  VALUES (v_user_id, v_church_id, 'owner');

  -- Set this as the user's active church
  UPDATE public.profiles
  SET church_id = v_church_id
  WHERE profiles.id = v_user_id;

  -- Return the church details
  RETURN QUERY
  SELECT v_church_id, p_name, p_slug, v_invite_code;

EXCEPTION
  WHEN unique_violation THEN
    -- Catch any unique constraint violations and provide friendly error
    IF SQLERRM LIKE '%churches_slug_key%' THEN
      RAISE EXCEPTION 'A church with this name already exists. Please choose a different name.';
    ELSE
      RAISE EXCEPTION 'A church with similar information already exists. Please check your input.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION create_church_with_owner TO authenticated;

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing profile church memberships to church_members table
INSERT INTO church_members (user_id, church_id, role)
SELECT id, church_id, role
FROM profiles
WHERE church_id IS NOT NULL
ON CONFLICT (user_id, church_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE church_members IS 'Junction table for many-to-many relationship between users and churches';
COMMENT ON COLUMN church_members.role IS 'User role in this specific church: owner (church creator), admin (full access), leader (limited admin), member (basic access)';
COMMENT ON COLUMN profiles.church_id IS 'User''s currently active/selected church. They may be members of multiple churches.';
