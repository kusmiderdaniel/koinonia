-- Change the default role from 'volunteer' to 'member'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'member';
