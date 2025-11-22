-- Fix infinite recursion in church_members RLS policies
-- Create a helper function that bypasses RLS to get user's church IDs

CREATE OR REPLACE FUNCTION get_user_church_ids(p_user_id UUID)
RETURNS TABLE (church_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.church_id
  FROM church_members cm
  WHERE cm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view memberships in their churches" ON church_members;

-- Create new policy using the helper function
CREATE POLICY "Users can view memberships in their churches"
  ON church_members FOR SELECT
  USING (
    church_id IN (
      SELECT get_user_church_ids(auth.uid())
    )
  );

COMMENT ON FUNCTION get_user_church_ids IS 'Helper function to get church IDs for a user, bypasses RLS to avoid recursion';
