/**
 * App-wide configuration constants.
 * In production these come from env vars / build config.
 */

export const Config = {
  // Supabase
  SUPABASE_URL:      'https://hctuqfkhcqzmyrkctwlt.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Zkt1bWpSqzinlOSaUm7Bcg_v3jGv5pw',
  // Service role key — NEVER ship in the app bundle; only used in scripts/
  // SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',

  // API (legacy REST wrapper — now routes through Supabase)
  API_BASE_URL:   __DEV__ ? 'https://dev-api.albert-app.com/v1' : 'https://api.albert-app.com/v1',
  API_TIMEOUT_MS: 10_000,

  // RevenueCat (in-app purchases)
  REVENUECAT_KEY_IOS:     'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  REVENUECAT_KEY_ANDROID: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

  // App
  APP_VERSION:     '1.0.0',
  BUILD_NUMBER:    '1',
  SUPPORT_EMAIL:   'support@albert-app.com',
  PRIVACY_URL:     'https://albert-app.com/privacy',
  TERMS_URL:       'https://albert-app.com/terms',

  // Content
  CDN_BASE:        'https://cdn.albert-app.com',
  MAX_OFFLINE_MB:  500,

  // Observability
  POSTHOG_API_KEY: 'phc_uzNo2TgioiiqXFhmYgCi6eq5LaVbNciobZtVxazdbMUF',
  POSTHOG_HOST:    'https://us.posthog.com',
  SENTRY_DSN:      'https://a0cdad9e43c1806a4da9a33a78e9703b@o4511383932305408.ingest.us.sentry.io/4511383945478144',

  // Feature flags
  FEATURE_OFFLINE_DOWNLOAD: false,   // Not yet shipped
  FEATURE_AUDIO:            true,    // Audio explainers via CDN manifest (v1.2+)
} as const;
