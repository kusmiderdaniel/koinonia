-- Fix all RLS recursion issues in church_members policies

-- Helper function to check if user is admin/leader/owner in a church
CREATE OR REPLACE FUNCTION is_church_admin(p_user_id UUID, p_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM church_members
    WHERE user_id = p_user_id
    AND church_id = p_church_id
    AND role IN ('owner', 'admin', 'leader')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate UPDATE policy without recursion
DROP POLICY IF EXISTS "Admins can update memberships in their church" ON church_members;

CREATE POLICY "Admins can update memberships in their church"
  ON church_members FOR UPDATE
  USING (
    is_church_admin(auth.uid(), church_id)
  );

-- Drop and recreate DELETE policy without recursion
DROP POLICY IF EXISTS "Admins can remove members from their church" ON church_members;

CREATE POLICY "Admins can remove members from their church"
  ON church_members FOR DELETE
  USING (
    is_church_admin(auth.uid(), church_id)
    AND NOT (
      -- Prevent removing the last owner
      role = 'owner'
      AND (SELECT COUNT(*) FROM church_members WHERE church_id = church_members.church_id AND role = 'owner') = 1
    )
  );

COMMENT ON FUNCTION is_church_admin IS 'Helper function to check if user has admin privileges in a church, bypasses RLS to avoid recursion';
