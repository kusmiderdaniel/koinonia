-- Migration: Add join_code to churches table
-- This replaces subdomain-based joining with a simple 6-character alphanumeric code

-- Function to generate 6-character alphanumeric code (e.g., '6YU94P')
CREATE OR REPLACE FUNCTION generate_alphanumeric_code(length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique join code (ensures no collisions)
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_alphanumeric_code(6);
    SELECT EXISTS(SELECT 1 FROM churches WHERE join_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add join_code column to churches table
ALTER TABLE churches
  ADD COLUMN join_code TEXT UNIQUE;

-- Generate codes for existing churches
UPDATE churches
SET join_code = generate_unique_join_code()
WHERE join_code IS NULL;

-- Make it NOT NULL after populating existing rows
ALTER TABLE churches
  ALTER COLUMN join_code SET NOT NULL;

-- Add index for fast lookups when users join via code
CREATE INDEX idx_churches_join_code ON churches(join_code);
