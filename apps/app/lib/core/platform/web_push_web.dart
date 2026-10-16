import 'dart:js_interop';

/// Bridge to web/push.js (service worker registration + PushManager).
@JS('nearsoulPush')
external _NearSoulPush? get _push;

extension type _NearSoulPush._(JSObject _) implements JSObject {
  external bool supported();
  external String permission();
  external JSPromise<JSString> subscribe(String vapidKey);
  external JSPromise<JSString> current();
  external JSPromise<JSAny?> unsubscribe();
  external void onOpen(JSFunction cb);
}

bool webPushSupported() => _push?.supported() ?? false;
String webPushPermission() => _push?.permission() ?? 'unsupported';
Future<String> webPushSubscribe(String vapidKey) async => (await _push!.subscribe(vapidKey).toDart).toDart;
Future<String> webPushCurrent() async => _push == null ? '' : (await _push!.current().toDart).toDart;
Future<void> webPushUnsubscribe() async => _push?.unsubscribe().toDart;
void webPushOnOpen(void Function(String path) cb) => _push?.onOpen(((JSString p) => cb(p.toDart)).toJS);
