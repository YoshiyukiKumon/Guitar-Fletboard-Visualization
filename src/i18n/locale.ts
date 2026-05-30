export const APP_LOCALES = ['ja', 'en'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'ja';

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'ja' || value === 'en';
}

export function normalizeLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}
