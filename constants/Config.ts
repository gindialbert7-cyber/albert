/**
 * App-wide configuration constants.
 * In production these come from env vars / build config.
 */

export const Config = {
  // Supabase — fill these in from supabase.com → project → Settings → API
  SUPABASE_URL:      'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  // Service role key — NEVER ship in the app bundle; only used in scripts/
  // SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',

  // API (legacy REST wrapper — now routes through Supabase)
  API_BASE_URL:   __DEV__ ? 'https://dev-api.albert-app.com/v1' : 'https://api.albert-app.com/v1',
  API_TIMEOUT_MS: 10_000,

  // RevenueCat (in-app purchases)
  REVENUECAT_KEY_IOS:     'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  REVENUECAT_KEY_ANDROID: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

  // App
  APP_VERSION:     '1.1.0',
  BUILD_NUMBER:    '11',
  SUPPORT_EMAIL:   'support@albert-app.com',
  PRIVACY_URL:     'https://albert-app.com/privacy',
  TERMS_URL:       'https://albert-app.com/terms',

  // Content
  CDN_BASE:        'https://cdn.albert-app.com',
  MAX_OFFLINE_MB:  500,

  // Observability
  POSTHOG_API_KEY: 'phc_REPLACE_WITH_REAL_KEY',
  POSTHOG_HOST:    'https://us.posthog.com',
  SENTRY_DSN:      'https://REPLACE@o0.ingest.sentry.io/0',

  // Feature flags
  FEATURE_OFFLINE_DOWNLOAD: false,   // Not yet shipped
  FEATURE_CHEVRUSA:         false,   // Coming soon
  FEATURE_AUDIO:            true,    // Audio explainers via CDN manifest (v1.2+)
  FEATURE_CLOUD_SYNC:       false,   // Coming soon
} as const;
