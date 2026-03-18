/**
 * Analytics event tracking
 *
 * Thin wrapper that:
 *   - Logs to console in dev
 *   - Will send to Amplitude / Mixpanel / PostHog in production
 *   - Never throws (analytics should never crash the app)
 */

type EventProperties = Record<string, string | number | boolean | null | undefined>;

// ─── Event names ──────────────────────────────────────────────────────────

export const Events = {
  // Onboarding
  ONBOARDING_START:       'onboarding_start',
  ONBOARDING_STEP:        'onboarding_step',
  ONBOARDING_COMPLETE:    'onboarding_complete',
  ONBOARDING_SKIP:        'onboarding_skip',

  // Auth
  SIGN_IN_TAP:            'sign_in_tap',
  SIGN_IN_SUCCESS:        'sign_in_success',
  SIGN_IN_FAIL:           'sign_in_fail',
  SIGN_UP_TAP:            'sign_up_tap',
  SIGN_UP_SUCCESS:        'sign_up_success',
  SIGN_UP_FAIL:           'sign_up_fail',
  SIGN_OUT:               'sign_out',

  // Subscription
  PAYWALL_VIEW:           'paywall_view',
  PLAN_SELECT:            'plan_select',
  TRIAL_START:            'trial_start',
  SUBSCRIBE_TAP:          'subscribe_tap',
  SUBSCRIBE_SUCCESS:      'subscribe_success',
  SUBSCRIBE_FAIL:         'subscribe_fail',
  CANCEL_TAP:             'cancel_tap',

  // Content
  BOOK_DETAIL_VIEW:       'book_detail_view',
  BOOK_OPEN:              'book_open',
  BOOK_ADD_LIBRARY:       'book_add_library',
  BOOK_REMOVE_LIBRARY:    'book_remove_library',
  CHAPTER_CHANGE:         'chapter_change',
  READING_COMPLETE:       'reading_complete',

  // Notes
  BOOKMARK_ADD:           'bookmark_add',
  BOOKMARK_DELETE:        'bookmark_delete',
  HIGHLIGHT_ADD:          'highlight_add',
  HIGHLIGHT_DELETE:       'highlight_delete',

  // Search
  SEARCH_QUERY:           'search_query',
  SEARCH_RESULT_TAP:      'search_result_tap',
  COLLECTION_TAP:         'collection_tap',
  CATEGORY_FILTER:        'category_filter',

  // Settings
  THEME_CHANGE:           'theme_change',
  FONT_SIZE_CHANGE:       'font_size_change',
  DARK_MODE_TOGGLE:       'dark_mode_toggle',

  // Streak
  STREAK_MILESTONE:       'streak_milestone',  // 3, 7, 30, 100 days
} as const;

export type EventName = typeof Events[keyof typeof Events];

// ─── Core track function ──────────────────────────────────────────────────

export function track(event: EventName, properties?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties ?? {});
    }
    // Production: Amplitude.logEvent(event, properties);
    // or: posthog.capture(event, properties);
  } catch {}
}

export function identify(userId: string, traits?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] identify(${userId})`, traits ?? {});
    }
    // Production: Amplitude.setUserId(userId); Amplitude.setUserProperties(traits);
  } catch {}
}

export function reset(): void {
  try {
    // Production: Amplitude.clearUserProperties(); Amplitude.setUserId(null);
  } catch {}
}

export function screen(name: string, properties?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] screen: ${name}`, properties ?? {});
    }
  } catch {}
}
