/**
 * App-wide configuration constants.
 * In production these come from env vars / build config.
 */

export const Config = {
  // API
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

  // Feature flags
  FEATURE_OFFLINE_DOWNLOAD: false,   // Not yet shipped
  FEATURE_CHEVRUSA:         false,   // Coming soon
  FEATURE_AUDIO:            false,   // Coming soon
  FEATURE_CLOUD_SYNC:       false,   // Coming soon
} as const;
