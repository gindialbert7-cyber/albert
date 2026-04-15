/**
 * utils/sentry.ts
 *
 * Sentry error monitoring initialisation and helpers.
 * Call initSentry() once at app startup before any rendering.
 *
 * captureException / captureMessage are safe to call before init
 * and in development — they no-op gracefully.
 */

import { Config } from '@/constants/Config';

let _sentry: typeof import('@sentry/react-native') | null = null;

export function initSentry(): void {
  if (__DEV__) return; // Never send errors from dev builds
  try {
    _sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    _sentry.init({
      dsn:         Config.SENTRY_DSN,
      environment: 'production',
      release:     `albert@${Config.APP_VERSION}+${Config.BUILD_NUMBER}`,
      // Sample 20% of performance traces in production
      tracesSampleRate: 0.2,
      // Attach breadcrumbs but strip PII from URLs
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.type === 'http' && breadcrumb.data?.url) {
          // Strip auth tokens from logged URLs
          breadcrumb.data.url = (breadcrumb.data.url as string).replace(/key=[^&]+/g, 'key=REDACTED');
        }
        return breadcrumb;
      },
    });
  } catch (e) {
    console.warn('[Sentry] init failed', e);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    if (__DEV__) {
      console.error('[Sentry] captureException (dev)', error);
      return;
    }
    _sentry?.captureException(error, context ? { extra: context } : undefined);
  } catch {}
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  try {
    if (__DEV__) {
      console.warn(`[Sentry] captureMessage (dev) [${level}]`, message);
      return;
    }
    _sentry?.captureMessage(message, level);
  } catch {}
}

export function setUser(userId: string | null): void {
  try {
    if (__DEV__) return;
    _sentry?.setUser(userId ? { id: userId } : null);
  } catch {}
}
