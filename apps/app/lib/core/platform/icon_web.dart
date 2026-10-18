import 'dart:js_interop';

@JS('nearsoulSetIcon')
external void _setIcon(String href);

/// Web: swap the browser-tab icon (web/image.js).
void setBrowserIcon(String href) {
  try {
    _setIcon(href);
  } catch (_) {}
}
