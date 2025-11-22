-- Auto-populate church_members with profile data (email, full_name, phone)

-- Function to sync profile data to church_members
CREATE OR REPLACE FUNCTION sync_profile_to_church_member()
RETURNS TRIGGER AS $$
BEGIN
  -- If email, full_name, or phone are not provided, get them from the profile
  IF NEW.email IS NULL OR NEW.full_name IS NULL OR NEW.phone IS NULL THEN
    SELECT
      COALESCE(NEW.email, p.email),
      COALESCE(NEW.full_name, p.full_name),
      COALESCE(NEW.phone, p.phone)
    INTO NEW.email, NEW.full_name, NEW.phone
    FROM profiles p
    WHERE p.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before INSERT on church_members
CREATE TRIGGER sync_profile_before_insert
  BEFORE INSERT ON church_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_church_member();

-- Update existing church_members records that are missing data
UPDATE church_members cm
SET
  email = COALESCE(cm.email, p.email),
  full_name = COALESCE(cm.full_name, p.full_name),
  phone = COALESCE(cm.phone, p.phone)
FROM profiles p
WHERE cm.user_id = p.id
AND (cm.email IS NULL OR cm.full_name IS NULL OR cm.phone IS NULL);

COMMENT ON FUNCTION sync_profile_to_church_member IS 'Automatically populates church_members with profile data on insert';
