/**
 * Shared formatting utilities
 */

/**
 * Format a reading progress fraction (0–1) as a percentage string.
 * @example formatProgress(0.742) → "74%"
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

/**
 * Format a reading time in minutes to a human-readable string.
 * @example formatReadingTime(127) → "2h 7m"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1)   return '< 1m';
  if (minutes < 60)  return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format a date as a relative string ("Today", "Yesterday", "3 days ago", or a date).
 */
export function formatRelativeDate(timestamp: number): string {
  const now  = Date.now();
  const diff = now - timestamp;
  const s    = Math.floor(diff / 1000);
  const m    = Math.floor(s / 60);
  const h    = Math.floor(m / 60);
  const d    = Math.floor(h / 24);

  if (d === 0)  return 'Today';
  if (d === 1)  return 'Yesterday';
  if (d < 7)    return `${d} days ago`;
  if (d < 30)   return `${Math.floor(d / 7)} week${d >= 14 ? 's' : ''} ago`;
  if (d < 365)  return `${Math.floor(d / 30)} month${d >= 60 ? 's' : ''} ago`;
  return `${Math.floor(d / 365)} year${d >= 730 ? 's' : ''} ago`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format a streak count with a label.
 */
export function formatStreak(days: number): string {
  if (days === 0) return 'No streak yet';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Format a book page count.
 */
export function formatPageCount(pages: number): string {
  if (pages < 1000) return `${pages} pp`;
  return `${(pages / 1000).toFixed(1)}k pp`;
}
