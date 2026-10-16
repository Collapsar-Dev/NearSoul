import { inQuietHours, isValidTimezone, localTime, pushDecision } from './push-policy';

describe('push policy (NOTIF-001, §5.8)', () => {
  const noon = new Date('2026-10-16T10:30:00Z'); // 12:30 in Amsterdam (CEST)
  const night = new Date('2026-10-16T22:30:00Z'); // 00:30 in Amsterdam
  const user = { notifyPrefs: {}, timezone: 'Europe/Amsterdam', lastReminderPushDay: null };

  it('reads local time in the user timezone, falling back to UTC for unknown zones', () => {
    expect(localTime(noon, 'Europe/Amsterdam')).toEqual({ date: '2026-10-16', hour: 12 });
    expect(localTime(night, 'Europe/Amsterdam')).toEqual({ date: '2026-10-17', hour: 0 });
    expect(localTime(noon, 'Mars/Olympus')).toEqual({ date: '2026-10-16', hour: 10 });
    expect(isValidTimezone('Asia/Yerevan')).toBe(true);
    expect(isValidTimezone('Mars/Olympus')).toBe(false);
  });

  it('quiet hours are 23:00–08:00', () => {
    expect([22, 23, 0, 7, 8].map(inQuietHours)).toEqual([false, true, true, true, false]);
  });

  it('respects per-type toggles', () => {
    expect(pushDecision('new_match', { ...user, notifyPrefs: { new_match: false } }, noon)).toBe('off');
    expect(pushDecision('new_message', { ...user, notifyPrefs: { new_match: false } }, noon)).toBe('send');
  });

  it('holds everything but messages during quiet hours', () => {
    expect(pushDecision('new_match', user, night)).toBe('quiet');
    expect(pushDecision('daily_set_ready', user, night)).toBe('quiet');
    expect(pushDecision('new_message', user, night)).toBe('send');
  });

  it('caps reminders at one per local day', () => {
    expect(pushDecision('daily_set_ready', { ...user, lastReminderPushDay: '2026-10-16' }, noon)).toBe('cap');
    expect(pushDecision('open_ending', { ...user, lastReminderPushDay: '2026-10-15' }, noon)).toBe('send');
    expect(pushDecision('new_match', { ...user, lastReminderPushDay: '2026-10-16' }, noon)).toBe('send');
  });
});
