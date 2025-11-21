-- =====================================================
-- CORE SCHEMA: Churches and Profiles
-- =====================================================
-- This migration creates the foundational tables for the
-- multi-tenant church management system.

-- =====================================================
-- CHURCHES TABLE
-- =====================================================
-- Represents tenant organizations (each church is a tenant)

CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  logo_url TEXT,
  website TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX churches_slug_idx ON churches(slug);
CREATE INDEX churches_subdomain_idx ON churches(subdomain);

-- Add check constraints
ALTER TABLE churches ADD CONSTRAINT churches_slug_format
  CHECK (slug ~ '^[a-z0-9-]+$');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with church context and additional info

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'leader', 'member')),
  bio TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX profiles_church_id_idx ON profiles(church_id);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_role_idx ON profiles(role);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Churches Policies
-- Users can view their own church
CREATE POLICY "Users can view their church"
  ON churches FOR SELECT
  USING (id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Church owners/admins can update their church
CREATE POLICY "Admins can update their church"
  ON churches FOR UPDATE
  USING (
    id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND church_id = churches.id
      AND role IN ('owner', 'admin')
    )
  );

-- Profiles Policies
-- Users can view profiles from their church
CREATE POLICY "Users can view profiles from their church"
  ON profiles FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Users can view their own profile (even without church)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update profiles in their church
CREATE POLICY "Admins can update profiles in their church"
  ON profiles FOR UPDATE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE churches IS 'Tenant organizations - each church is a separate tenant with isolated data';
COMMENT ON TABLE profiles IS 'User profiles extending auth.users with church context and role';
COMMENT ON COLUMN profiles.role IS 'User role: owner (church creator), admin (full access), leader (limited admin), member (basic access)';
COMMENT ON COLUMN churches.settings IS 'Church-specific settings as JSON (features, branding, etc.)';
COMMENT ON COLUMN profiles.preferences IS 'User preferences as JSON (notifications, display settings, etc.)';
