-- Add language preference column to profiles table
-- Stores user's preferred UI language (BCP 47 format)
-- NULL means use browser detection for public pages or English as default

ALTER TABLE profiles ADD COLUMN language VARCHAR(5) DEFAULT NULL;

COMMENT ON COLUMN profiles.language IS
'User preferred language code (BCP 47 format: en, pl, etc.). NULL = browser detection/English default.';

-- Index for efficient filtering (useful for batch email operations)
CREATE INDEX idx_profiles_language ON profiles(language) WHERE language IS NOT NULL;

-- Constraint to validate supported language codes
-- To add a new language later: ALTER TABLE profiles DROP CONSTRAINT profiles_language_check;
-- Then: ALTER TABLE profiles ADD CONSTRAINT profiles_language_check CHECK (language IS NULL OR language IN ('en', 'pl', 'new_lang'));
ALTER TABLE profiles ADD CONSTRAINT profiles_language_check
CHECK (language IS NULL OR language IN ('en', 'pl'));
