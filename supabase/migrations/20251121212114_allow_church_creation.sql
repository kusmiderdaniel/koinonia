-- Allow authenticated users to create churches
CREATE POLICY "Authenticated users can create churches"
  ON churches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to insert their own profile (for initial setup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
