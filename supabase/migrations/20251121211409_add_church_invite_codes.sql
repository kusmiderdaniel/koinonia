-- Add invite code functionality to churches table
ALTER TABLE churches ADD COLUMN invite_code TEXT UNIQUE;
ALTER TABLE churches ADD COLUMN invite_code_generated_at TIMESTAMPTZ;

-- Create index for faster invite code lookups
CREATE INDEX churches_invite_code_idx ON churches(invite_code) WHERE invite_code IS NOT NULL;

-- Function to generate a random invite code (6 characters: uppercase letters and numbers)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar looking chars (I,1,O,0)
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique invite code for a church
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
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN churches.invite_code IS 'Unique 6-character code for inviting members to join the church';
COMMENT ON COLUMN churches.invite_code_generated_at IS 'Timestamp when the current invite code was generated';
