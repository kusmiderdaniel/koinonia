-- Add multilingual support for form title and description
-- This allows forms to have translated titles and descriptions

-- ============================================================================
-- ADD I18N COLUMNS TO FORMS TABLE
-- ============================================================================

-- Title translations: {"en": "Event Registration", "pl": "Rejestracja na wydarzenie"}
ALTER TABLE forms ADD COLUMN title_i18n JSONB;
COMMENT ON COLUMN forms.title_i18n IS
'Translated titles: {"en": "Title", "pl": "Tytuł"}';

-- Description translations
ALTER TABLE forms ADD COLUMN description_i18n JSONB;
COMMENT ON COLUMN forms.description_i18n IS
'Translated descriptions: {"en": "Description", "pl": "Opis"}';
