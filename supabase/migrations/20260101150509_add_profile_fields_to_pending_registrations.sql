-- Add profile fields to pending_registrations table
-- These fields allow collecting user information during the join church flow

ALTER TABLE pending_registrations
ADD COLUMN phone TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));

-- Add comments
COMMENT ON COLUMN pending_registrations.phone IS 'User phone number';
COMMENT ON COLUMN pending_registrations.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN pending_registrations.sex IS 'User sex: male or female';
