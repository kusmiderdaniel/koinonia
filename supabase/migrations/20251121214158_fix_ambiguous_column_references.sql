-- Fix ambiguous column references in RLS policies by explicitly qualifying table names

-- Drop and recreate "Admins can update their church" policy with qualified columns
DROP POLICY IF EXISTS "Admins can update their church" ON churches;

CREATE POLICY "Admins can update their church"
  ON churches FOR UPDATE
  USING (
    churches.id = (SELECT profiles.church_id FROM profiles WHERE profiles.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = churches.id
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Drop and recreate "Users can view profiles from their church" policy with qualified columns
DROP POLICY IF EXISTS "Users can view profiles from their church" ON profiles;

CREATE POLICY "Users can view profiles from their church"
  ON profiles FOR SELECT
  USING (profiles.church_id = (SELECT p.church_id FROM profiles p WHERE p.id = auth.uid()));

-- Drop and recreate "Admins can update profiles in their church" policy with qualified columns
DROP POLICY IF EXISTS "Admins can update profiles in their church" ON profiles;

CREATE POLICY "Admins can update profiles in their church"
  ON profiles FOR UPDATE
  USING (
    profiles.church_id = (SELECT p.church_id FROM profiles p WHERE p.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- Drop and recreate "Users can view their church" policy with qualified columns
DROP POLICY IF EXISTS "Users can view their church" ON churches;

CREATE POLICY "Users can view their church"
  ON churches FOR SELECT
  USING (churches.id = (SELECT profiles.church_id FROM profiles WHERE profiles.id = auth.uid()));
