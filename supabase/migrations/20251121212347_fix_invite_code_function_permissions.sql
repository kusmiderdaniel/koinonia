-- Update functions to run with elevated permissions (SECURITY DEFINER)
-- This allows them to bypass RLS when checking for duplicate codes

CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM churches WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
