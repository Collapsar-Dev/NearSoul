// CR-33: Sign in with Google, Apple and VK ID on the web (lib/core/platform/social_web.dart).
// The browser only obtains a token or code; the API verifies it. Nothing is stored here.
(function () {
  var CALLBACK = location.origin + '/auth/callback.html';
  function rand(n) {
    var a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function challenge(verifier) {
    var d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode.apply(null, new Uint8Array(d))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Opens the popup synchronously (browsers block popups opened after an await), then navigates it.
  function popup() {
    var w = 480, h = 640;
    var x = window.screenX + (window.outerWidth - w) / 2, y = window.screenY + (window.outerHeight - h) / 2;
    var p = window.open('about:blank', 'ns_oauth', 'width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
    if (!p) throw new Error('popup_blocked');
    return p;
  }
  function waitFor(p, state) {
    return new Promise(function (resolve, reject) {
      var timer = setInterval(function () {
        if (p.closed) { cleanup(); reject(new Error('cancelled')); }
      }, 500);
      function onMsg(e) {
        if (e.origin !== location.origin || !e.data || e.data.type !== 'ns-oauth') return;
        var q = new URLSearchParams(e.data.hash || e.data.search);
        cleanup();
        if (q.get('state') !== state) return reject(new Error('state'));
        if (q.get('error')) return reject(new Error(q.get('error')));
        resolve(q);
      }
      function cleanup() { clearInterval(timer); window.removeEventListener('message', onMsg); }
      window.addEventListener('message', onMsg);
    });
  }
  var appleLoading = null;
  function loadApple() {
    appleLoading = appleLoading || new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return appleLoading;
  }
  window.nearsoulSocial = {
    // Load Apple's script early so its popup opens straight from the tap.
    preloadApple: function () { loadApple().catch(function () {}); },
    google: async function (clientId) {
      var p = popup(), state = rand(16), nonce = rand(16);
      p.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: clientId, redirect_uri: CALLBACK, response_type: 'id_token', scope: 'openid email profile', nonce: nonce, state: state, prompt: 'select_account',
      });
      var q = await waitFor(p, state);
      return JSON.stringify({ idToken: q.get('id_token'), nonce: nonce });
    },
    apple: async function (clientId) {
      var state = rand(16), nonce = rand(16);
      if (!window.AppleID) await loadApple();
      window.AppleID.auth.init({ clientId: clientId, scope: 'name email', redirectURI: CALLBACK, state: state, nonce: nonce, usePopup: true });
      var r = await window.AppleID.auth.signIn();
      if (!r || !r.authorization || r.authorization.state !== state) throw new Error('state');
      return JSON.stringify({ idToken: r.authorization.id_token, nonce: nonce });
    },
    vk: async function (clientId) {
      var p = popup(), state = rand(16), verifier = rand(48);
      var c = await challenge(verifier);
      p.location.href = 'https://id.vk.com/authorize?' + new URLSearchParams({
        response_type: 'code', client_id: clientId, redirect_uri: CALLBACK, state: state, code_challenge: c, code_challenge_method: 'S256', scope: 'email',
      });
      var q = await waitFor(p, state);
      return JSON.stringify({ code: q.get('code'), deviceId: q.get('device_id'), codeVerifier: verifier, redirectUri: CALLBACK });
    },
  };
})();
