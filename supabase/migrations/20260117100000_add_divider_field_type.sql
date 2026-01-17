-- Add 'divider' to the allowed form field types
-- This enables a visual separator/divider field with optional title

-- Drop the existing type constraint and add a new one that includes 'divider'
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_type_check;

ALTER TABLE form_fields ADD CONSTRAINT form_fields_type_check
  CHECK (type IN ('text', 'textarea', 'number', 'email', 'date', 'single_select', 'multi_select', 'checkbox', 'divider'));
