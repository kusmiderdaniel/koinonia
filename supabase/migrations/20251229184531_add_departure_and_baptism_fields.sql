-- ============================================
-- Add Departure and Baptism Fields to Profiles
-- ============================================
-- date_of_departure: when the user left the church
-- reason_for_departure: why they left
-- baptism: whether the user has been baptized
-- baptism_date: when they were baptized
-- ============================================

ALTER TABLE profiles
ADD COLUMN date_of_departure DATE,
ADD COLUMN reason_for_departure TEXT,
ADD COLUMN baptism BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN baptism_date DATE;
