import type { NotificationType } from './notifications.service';

/** Non-conversation pushes share a cap of one per local day (§5.8). */
export const REMINDER_TYPES: ReadonlySet<NotificationType> = new Set(['daily_set_ready', 'open_ending']);
/** Messages in active conversations still arrive during quiet hours (NOTIF-001). */
const QUIET_HOURS_EXEMPT: ReadonlySet<NotificationType> = new Set(['new_message']);
export const NOTIFICATION_TYPES: readonly NotificationType[] = ['new_match', 'new_message', 'daily_set_ready', 'nearby_alert', 'open_ending', 'report_update', 'message_request'];
const QUIET_FROM = 23;
const QUIET_TO = 8;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Local calendar date and hour in the user's timezone (falls back to UTC for an unknown zone). */
export function localTime(now: Date, timezone: string): { date: string; hour: number } {
  const tz = isValidTimezone(timezone) ? timezone : 'UTC';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

export function inQuietHours(hour: number): boolean {
  return hour >= QUIET_FROM || hour < QUIET_TO;
}

export type PushDecision = 'send' | 'off' | 'quiet' | 'cap';

/** Whether a push may go out now. The in-app notification centre always stores the event regardless. */
export function pushDecision(
  type: NotificationType,
  user: { notifyPrefs: unknown; timezone: string; lastReminderPushDay: string | null },
  now: Date,
): PushDecision {
  const prefs = (user.notifyPrefs ?? {}) as Partial<Record<NotificationType, boolean>>;
  if (prefs[type] === false) return 'off';
  const local = localTime(now, user.timezone);
  if (!QUIET_HOURS_EXEMPT.has(type) && inQuietHours(local.hour)) return 'quiet';
  if (REMINDER_TYPES.has(type) && user.lastReminderPushDay === local.date) return 'cap';
  return 'send';
}
