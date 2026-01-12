-- Add multilingual support for forms
-- This allows form fields to have translations for label, description, placeholder, and options

-- ============================================================================
-- 1. ADD is_multilingual FLAG TO FORMS TABLE
-- ============================================================================
ALTER TABLE forms ADD COLUMN is_multilingual BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN forms.is_multilingual IS
'When true, form fields can have translations for labels, descriptions, placeholders, and options';

-- ============================================================================
-- 2. ADD I18N COLUMNS TO FORM_FIELDS TABLE
-- ============================================================================

-- Label translations: {"en": "Question", "pl": "Pytanie"}
ALTER TABLE form_fields ADD COLUMN label_i18n JSONB;
COMMENT ON COLUMN form_fields.label_i18n IS
'Translated labels: {"en": "Label", "pl": "Etykieta"}';

-- Description translations
ALTER TABLE form_fields ADD COLUMN description_i18n JSONB;
COMMENT ON COLUMN form_fields.description_i18n IS
'Translated descriptions: {"en": "Help text", "pl": "Tekst pomocniczy"}';

-- Placeholder translations
ALTER TABLE form_fields ADD COLUMN placeholder_i18n JSONB;
COMMENT ON COLUMN form_fields.placeholder_i18n IS
'Translated placeholders: {"en": "Enter value", "pl": "Wprowadź wartość"}';

-- Options with translations (for single_select/multi_select)
-- Format: [{"value": "opt1", "label": {"en": "Option 1", "pl": "Opcja 1"}, "color": "blue"}]
ALTER TABLE form_fields ADD COLUMN options_i18n JSONB;
COMMENT ON COLUMN form_fields.options_i18n IS
'Options with translated labels: [{"value": "opt1", "label": {"en": "Option 1", "pl": "Opcja 1"}, "color": "blue"}]';

-- ============================================================================
-- 3. INDEX FOR MULTILINGUAL FORMS LOOKUP
-- ============================================================================
CREATE INDEX idx_forms_is_multilingual ON forms(is_multilingual) WHERE is_multilingual = true;
