/**
 * utils/analytics.ts
 *
 * Thin PostHog wrapper.
 *   - In development: logs to console only
 *   - In production:  sends events to PostHog
 *
 * Call initAnalytics() once at app startup (in _layout.tsx).
 * The `track`, `identify`, `screen`, and `reset` functions are safe to call
 * before init — they queue until PostHog is ready, or no-op on failure.
 */

import { Config } from '@/constants/Config';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

// ─── PostHog lazy singleton ───────────────────────────────────────────────────

let _ph: any = null;

export function initAnalytics(): void {
  if (_ph || __DEV__) return;
  try {
    // Lazy import so bundle-splitting keeps PostHog out of the critical path
    const PostHog = require('posthog-react-native').default;
    _ph = new PostHog(Config.POSTHOG_API_KEY, {
      host:                Config.POSTHOG_HOST,
      captureAppLifecycleEvents: true,
      captureDeepLinks:          true,
    });
  } catch (e) {
    console.warn('[Analytics] PostHog init failed', e);
  }
}

// ─── Event names ──────────────────────────────────────────────────────────────

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
  STREAK_MILESTONE:       'streak_milestone',
} as const;

export type EventName = typeof Events[keyof typeof Events];

// ─── Core functions ───────────────────────────────────────────────────────────

export function track(event: EventName, properties?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties ?? {});
      return;
    }
    _ph?.capture(event, properties);
  } catch {}
}

export function identify(userId: string, traits?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] identify(${userId})`, traits ?? {});
      return;
    }
    _ph?.identify(userId, traits);
  } catch {}
}

export function reset(): void {
  try {
    _ph?.reset();
  } catch {}
}

export function screen(name: string, properties?: EventProperties): void {
  try {
    if (__DEV__) {
      console.log(`[Analytics] screen: ${name}`, properties ?? {});
      return;
    }
    _ph?.screen(name, properties);
  } catch {}
}
