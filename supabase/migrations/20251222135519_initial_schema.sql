-- Initial Schema: Churches, Profiles, and Ministries
-- This migration sets up the core multi-tenant architecture

-- ============================================================================
-- STEP 1: CREATE ALL TABLES
-- ============================================================================

-- CHURCHES TABLE (Tenant Organizations)
CREATE TABLE churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'USA',
  phone text,
  email text,
  website text,
  logo_url text,
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- PROFILES TABLE (User Profiles)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'volunteer' CHECK (role IN ('owner', 'admin', 'leader', 'volunteer')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  bio text,
  skills text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  receive_email_notifications boolean DEFAULT true,
  receive_push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- MINISTRIES TABLE (Departments/Teams within Churches)
CREATE TABLE ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  color text DEFAULT '#3B82F6', -- Tailwind blue-500 as default
  icon text, -- Icon name for UI
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(church_id, name)
);

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

-- Churches indexes
CREATE INDEX idx_churches_subdomain ON churches(subdomain);

-- Profiles indexes
CREATE INDEX idx_profiles_church_id ON profiles(church_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Ministries indexes
CREATE INDEX idx_ministries_church_id ON ministries(church_id);
CREATE INDEX idx_ministries_leader_id ON ministries(leader_id);
CREATE INDEX idx_ministries_is_active ON ministries(is_active);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================================================

-- Churches policies
CREATE POLICY "Authenticated users can create churches"
  ON churches FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own church"
  ON churches FOR SELECT
  USING (id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Church admins can update their church"
  ON churches FOR UPDATE
  USING (id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Profiles policies
CREATE POLICY "Users can view profiles from their church"
  ON profiles FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Ministries policies
CREATE POLICY "Users can view ministries from their church"
  ON ministries FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Church admins can manage ministries"
  ON ministries FOR ALL
  USING (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Ministry leaders can update their ministries"
  ON ministries FOR UPDATE
  USING (
    leader_id = auth.uid() OR
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at
  BEFORE UPDATE ON ministries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Note: In production, churches and profiles will be created through the app
-- This is just for local development testing
