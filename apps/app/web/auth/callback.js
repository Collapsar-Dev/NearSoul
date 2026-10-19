// CR-33: the sign-in popup lands here and hands the result back to the app window (same origin only).
(function () {
  var data = { type: 'ns-oauth', hash: location.hash.slice(1), search: location.search.slice(1) };
  if (window.opener) {
    window.opener.postMessage(data, location.origin);
    window.close();
  } else {
    document.body.textContent = 'You can close this window.';
  }
})();
