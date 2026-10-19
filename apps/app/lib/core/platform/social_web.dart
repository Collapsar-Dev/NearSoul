import 'dart:convert';
import 'dart:js_interop';

/// Bridge to web/social.js: runs the provider popup and returns the token/code payload for the API.
@JS('nearsoulSocial')
external _NearSoulSocial? get _social;

extension type _NearSoulSocial._(JSObject _) implements JSObject {
  external JSPromise<JSString> google(String clientId);
  external JSPromise<JSString> apple(String clientId);
  external JSPromise<JSString> vk(String clientId);
  external void preloadApple();
}

const socialSupported = true;

void preloadApple() => _social?.preloadApple();

Future<Map<String, dynamic>> socialAuthorize(String provider, String clientId) async {
  final s = _social;
  if (s == null) throw StateError('unavailable');
  final js = switch (provider) { 'google' => s.google(clientId), 'apple' => s.apple(clientId), _ => s.vk(clientId) };
  return (jsonDecode((await js.toDart).toDart) as Map).cast<String, dynamic>();
}
