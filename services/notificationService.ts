/**
 * notificationService — daily learning reminders for Albert.
 *
 * This service wraps expo-notifications to:
 *   1. Request permission on first launch
 *   2. Schedule a daily learning reminder (customizable time)
 *   3. Cancel / reschedule when the user changes their preference
 *
 * To activate: call `initNotifications()` in your root layout's useEffect.
 * To add expo-notifications: npx expo install expo-notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY         = 'albert-notif-prefs-v1';
const DEFAULT_HOUR     = 9;   // 9 AM
const DEFAULT_MINUTE   = 0;
const DAILY_NOTIF_ID   = 'albert-daily-learning';

export interface NotifPrefs {
  enabled:  boolean;
  hour:     number;
  minute:   number;
}

const DEFAULT_PREFS: NotifPrefs = {
  enabled: true,
  hour:    DEFAULT_HOUR,
  minute:  DEFAULT_MINUTE,
};

// ── Storage ──────────────────────────────────────────────────────────────────

export async function getNotifPrefs(): Promise<NotifPrefs> {
  try {
    const json = await AsyncStorage.getItem(PREF_KEY);
    return json ? { ...DEFAULT_PREFS, ...JSON.parse(json) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotifPrefs(prefs: Partial<NotifPrefs>): Promise<void> {
  const current = await getNotifPrefs();
  const next = { ...current, ...prefs };
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next));
}

// ── Core (uses dynamic import to avoid crash when expo-notifications not installed) ──

let _Notifications: any = null;

async function getNotifications() {
  if (_Notifications) return _Notifications;
  try {
    _Notifications = await import('expo-notifications');
    return _Notifications;
  } catch {
    return null;
  }
}

// ── Permission ───────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;

  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Scheduling ───────────────────────────────────────────────────────────────

const REMINDER_MESSAGES = [
  { title: 'לימוד יומי', body: 'Your daily Torah learning awaits. Just a few minutes makes a difference.' },
  { title: 'Time to Learn', body: 'Your sefer is waiting. Continue where you left off.' },
  { title: 'Daily Learning Reminder', body: 'A few minutes of Torah study can transform your day.' },
  { title: 'בוקר טוב', body: 'Good morning! Start your day with a few minutes of learning.' },
  { title: 'Keep Your Streak Going', body: 'Don\'t break your learning streak — open Albert and read today.' },
];

export async function scheduleDailyReminder(hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  try {
    // Cancel any existing daily notification
    await cancelDailyReminder();

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Pick a random message
    const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

    await N.scheduleNotificationAsync({
      identifier: DAILY_NOTIF_ID,
      content: {
        title: msg.title,
        body:  msg.body,
        sound: true,
        data:  { type: 'daily_reminder' },
      },
      trigger: {
        type:    'calendar',
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (e) {
    console.warn('[Albert] Failed to schedule notification:', e);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(DAILY_NOTIF_ID);
  } catch {}
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initNotifications(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  // Set notification handler (how notifications appear when app is foregrounded)
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge:  false,
    }),
  });

  const prefs = await getNotifPrefs();
  if (prefs.enabled) {
    await scheduleDailyReminder(prefs.hour, prefs.minute);
  }
}

// ── User-facing toggle ────────────────────────────────────────────────────────

export async function toggleNotifications(enabled: boolean, hour?: number, minute?: number): Promise<void> {
  const h = hour   ?? DEFAULT_HOUR;
  const m = minute ?? DEFAULT_MINUTE;
  await saveNotifPrefs({ enabled, hour: h, minute: m });
  if (enabled) {
    await scheduleDailyReminder(h, m);
  } else {
    await cancelDailyReminder();
  }
}
