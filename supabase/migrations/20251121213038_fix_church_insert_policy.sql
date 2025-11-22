-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create churches" ON churches;

-- Create a new INSERT policy with explicit auth.uid() check
CREATE POLICY "Authenticated users can create churches"
  ON churches FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
