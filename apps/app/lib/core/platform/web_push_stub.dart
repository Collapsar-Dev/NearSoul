/// Native platforms: Web Push is not available (FCM arrives with the native Firebase setup).
bool webPushSupported() => false;
String webPushPermission() => 'unsupported';
Future<String> webPushSubscribe(String vapidKey) async => '';
Future<String> webPushCurrent() async => '';
Future<void> webPushUnsubscribe() async {}
void webPushOnOpen(void Function(String path) cb) {}
