-- Add settings column to form_fields for field-type-specific configuration
-- For number fields: { "format": "number|currency|percentage", "min": number, "max": number, "decimals": number }

ALTER TABLE form_fields ADD COLUMN settings JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN form_fields.settings IS 'Field-type-specific settings. For number fields: { format, min, max, decimals }';
