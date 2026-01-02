-- Migration: Migrate existing data to use campuses
-- Creates default campus for each church and assigns all existing data to it

-- ============================================================================
-- CREATE DEFAULT CAMPUS FOR EACH CHURCH
-- ============================================================================

INSERT INTO campuses (church_id, name, description, is_default, is_active, color)
SELECT
  id as church_id,
  'Main Campus' as name,
  'Default campus for ' || name as description,
  true as is_default,
  true as is_active,
  '#3B82F6' as color
FROM churches
WHERE NOT EXISTS (
  SELECT 1 FROM campuses c WHERE c.church_id = churches.id
);

-- ============================================================================
-- ASSIGN ALL EXISTING PROFILES TO DEFAULT CAMPUS
-- ============================================================================

INSERT INTO profile_campuses (profile_id, campus_id, is_primary)
SELECT
  p.id as profile_id,
  c.id as campus_id,
  true as is_primary
FROM profiles p
JOIN campuses c ON c.church_id = p.church_id AND c.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM profile_campuses pc WHERE pc.profile_id = p.id
);

-- ============================================================================
-- ASSIGN ALL EXISTING EVENTS TO DEFAULT CAMPUS
-- ============================================================================

INSERT INTO event_campuses (event_id, campus_id)
SELECT
  e.id as event_id,
  c.id as campus_id
FROM events e
JOIN campuses c ON c.church_id = e.church_id AND c.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM event_campuses ec WHERE ec.event_id = e.id
);

-- ============================================================================
-- UPDATE MINISTRIES WITH DEFAULT CAMPUS
-- ============================================================================

UPDATE ministries m
SET campus_id = (
  SELECT c.id FROM campuses c
  WHERE c.church_id = m.church_id AND c.is_default = true
  LIMIT 1
)
WHERE m.campus_id IS NULL;

-- ============================================================================
-- UPDATE EVENT TEMPLATES WITH DEFAULT CAMPUS
-- ============================================================================

UPDATE event_templates et
SET campus_id = (
  SELECT c.id FROM campuses c
  WHERE c.church_id = et.church_id AND c.is_default = true
  LIMIT 1
)
WHERE et.campus_id IS NULL;

-- ============================================================================
-- UPDATE PENDING REGISTRATIONS WITH DEFAULT CAMPUS
-- ============================================================================

UPDATE pending_registrations pr
SET campus_id = (
  SELECT c.id FROM campuses c
  WHERE c.church_id = pr.church_id AND c.is_default = true
  LIMIT 1
)
WHERE pr.campus_id IS NULL;
