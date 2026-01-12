/**
 * Helpers for resolving form field translations
 */

import type { Locale } from './config'
import type { TranslatedString, SelectOption, SelectOptionI18n } from '@/lib/validations/forms'

/**
 * Resolve a translated string to the current locale with fallback
 * @param i18n - The translated string object
 * @param fallback - The fallback string (usually the default label)
 * @param locale - The target locale
 * @returns The resolved string
 */
export function resolveTranslation(
  i18n: TranslatedString | null | undefined,
  fallback: string,
  locale: Locale
): string {
  if (!i18n) return fallback

  // Try the requested locale first
  const value = i18n[locale]
  if (value) return value

  // Fall back to English
  if (i18n.en) return i18n.en

  // Last resort: use the fallback
  return fallback
}

/**
 * Resolve select options to the current locale
 * @param options - The base options array
 * @param optionsI18n - The translated options array
 * @param locale - The target locale
 * @returns Options with resolved labels
 */
export function resolveOptions(
  options: SelectOption[] | null | undefined,
  optionsI18n: SelectOptionI18n[] | null | undefined,
  locale: Locale
): SelectOption[] {
  if (!options) return []

  // If no i18n options, return original
  if (!optionsI18n || optionsI18n.length === 0) return options

  return options.map((opt, index) => {
    const i18nOpt = optionsI18n[index]
    if (!i18nOpt) return opt

    return {
      ...opt,
      label: resolveTranslation(i18nOpt.label, opt.label, locale),
    }
  })
}

/**
 * Form field with all translatable properties
 */
interface TranslatableFormField {
  label: string
  label_i18n?: TranslatedString | null
  description?: string | null
  description_i18n?: TranslatedString | null
  placeholder?: string | null
  placeholder_i18n?: TranslatedString | null
  options?: SelectOption[] | null
  options_i18n?: SelectOptionI18n[] | null
}

/**
 * Resolved form field with translations applied
 */
export interface ResolvedFormField {
  label: string
  description: string | null
  placeholder: string | null
  options: SelectOption[] | null
}

/**
 * Resolve all translatable properties of a form field
 * @param field - The form field with i18n properties
 * @param locale - The target locale
 * @returns The field with resolved translations
 */
export function resolveFormField<T extends TranslatableFormField>(
  field: T,
  locale: Locale
): T & ResolvedFormField {
  const resolvedDescription = field.description_i18n
    ? resolveTranslation(field.description_i18n, field.description || '', locale)
    : field.description
  const resolvedPlaceholder = field.placeholder_i18n
    ? resolveTranslation(field.placeholder_i18n, field.placeholder || '', locale)
    : field.placeholder

  return {
    ...field,
    label: resolveTranslation(field.label_i18n, field.label, locale),
    description: resolvedDescription || null,
    placeholder: resolvedPlaceholder || null,
    options: resolveOptions(field.options, field.options_i18n, locale),
  }
}

/**
 * Resolve all fields in a form to the current locale
 * @param fields - Array of form fields with i18n properties
 * @param locale - The target locale
 * @returns Array of fields with resolved translations
 */
export function resolveFormFields<T extends TranslatableFormField>(
  fields: T[],
  locale: Locale
): (T & ResolvedFormField)[] {
  return fields.map((field) => resolveFormField(field, locale))
}

/**
 * Form with translatable title and description
 */
interface TranslatableForm {
  title: string
  title_i18n?: TranslatedString | null
  description?: string | null
  description_i18n?: TranslatedString | null
}

/**
 * Resolved form with translations applied
 */
export interface ResolvedForm {
  title: string
  description: string | null
}

/**
 * Resolve form title and description to the current locale
 * @param form - The form with i18n properties
 * @param locale - The target locale
 * @returns Object with resolved title and description
 */
export function resolveFormTitleDescription<T extends TranslatableForm>(
  form: T,
  locale: Locale
): ResolvedForm {
  const resolvedTitle = form.title_i18n
    ? resolveTranslation(form.title_i18n, form.title, locale)
    : form.title

  const resolvedDescription = form.description_i18n
    ? resolveTranslation(form.description_i18n, form.description || '', locale)
    : form.description

  return {
    title: resolvedTitle,
    description: resolvedDescription || null,
  }
}
