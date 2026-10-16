// NearSoul Web Push service worker (NOTIF-001). Only shows generic texts sent by the server; no fetch handling.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function targetPath(data) {
  switch (data && data.type) {
    case 'new_match':
    case 'new_message':
      return data.matchId ? '/matches/' + data.matchId : '/matches';
    case 'nearby_alert':
    case 'open_ending':
      return '/nearby';
    case 'daily_set_ready':
      return '/today';
    default:
      return '/me/notifications';
  }
}

self.addEventListener('push', (event) => {
  let msg = { title: 'NearSoul', body: '', data: {} };
  try {
    msg = event.data ? event.data.json() : msg;
  } catch (_) {}
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // The app is open and visible: the in-app realtime notice is enough.
      if (wins.some((w) => w.visibilityState === 'visible' && w.focused)) return;
      return self.registration.showNotification(msg.title || 'NearSoul', {
        body: msg.body || '',
        icon: '/icons/Icon-192.png',
        badge: '/icons/Icon-192.png',
        tag: (msg.data && msg.data.type) || 'nearsoul',
        data: { path: targetPath(msg.data) },
      });
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.path) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.postMessage({ type: 'nearsoul-open', path });
          return w.focus();
        }
      }
      return self.clients.openWindow(path);
    }),
  );
});
