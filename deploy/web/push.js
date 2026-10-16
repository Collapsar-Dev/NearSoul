// Small bridge used by the Flutter app (lib/core/web_push_web.dart) to manage the Web Push subscription.
(function () {
  const SCOPE = '/push/';
  function b64ToBytes(s) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  // The worker's scope (/push/) does not cover the app pages, so navigator.serviceWorker.ready would never
  // resolve: wait for this registration's own worker to activate instead.
  async function registration() {
    const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: SCOPE });
    if (reg.active) return reg;
    const sw = reg.installing || reg.waiting;
    await new Promise((resolve) => {
      if (!sw) return resolve();
      sw.addEventListener('statechange', () => sw.state === 'activated' && resolve());
    });
    return reg;
  }
  window.nearsoulPush = {
    supported: () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    permission: () => ('Notification' in window ? Notification.permission : 'unsupported'),
    // Resolves to the subscription JSON, or '' when the person declined.
    subscribe: async (vapidKey) => {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return '';
      const reg = await registration();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapidKey) });
      return JSON.stringify(sub.toJSON());
    },
    // Current subscription JSON if permission is already granted (used to refresh after sign-in).
    current: async () => {
      if (!('serviceWorker' in navigator)) return '';
      const reg = await navigator.serviceWorker.getRegistration(SCOPE);
      const sub = reg && (await reg.pushManager.getSubscription());
      return sub ? JSON.stringify(sub.toJSON()) : '';
    },
    unsubscribe: async () => {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration(SCOPE) : null;
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) await sub.unsubscribe();
    },
    // Taps on a notification while the app is open navigate inside the app.
    onOpen: (cb) => {
      if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'nearsoul-open') cb(e.data.path);
      });
    },
  };
})();
