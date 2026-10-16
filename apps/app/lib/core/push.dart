import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'session.dart';
import 'platform/web_push_stub.dart' if (dart.library.js_interop) 'platform/web_push_web.dart';

enum PushState { unsupported, off, on, blocked }

/// Push notifications (NOTIF-001). Web: Web Push through web/push-sw.js. Native: FCM once Firebase is set up.
class PushController {
  PushController(this._api);
  final dynamic _api;

  PushState state() {
    if (!webPushSupported()) return PushState.unsupported;
    return switch (webPushPermission()) {
      'denied' => PushState.blocked,
      'granted' => PushState.on,
      _ => PushState.off,
    };
  }

  /// Asks for permission (must be called from a tap) and registers the subscription with the server.
  Future<PushState> enable() async {
    if (!webPushSupported()) return PushState.unsupported;
    final config = await _api.get<Map<String, dynamic>>('/v1/push/config');
    final sub = await webPushSubscribe(config['webPushPublicKey'] as String);
    if (sub.isEmpty) return state();
    await _api.post('/v1/devices', {'token': sub, 'platform': 'web'});
    return PushState.on;
  }

  Future<void> disable() async {
    await webPushUnsubscribe();
    await _api.delete('/v1/devices');
  }

  /// After sign-in: re-attach an existing browser subscription to the new session (no prompt).
  Future<void> refresh() async {
    if (state() != PushState.on) return;
    final sub = await webPushCurrent();
    if (sub.isNotEmpty) await _api.post('/v1/devices', {'token': sub, 'platform': 'web'});
  }

  static void onOpen(void Function(String path) cb) => webPushOnOpen(cb);
}

final pushProvider = Provider<PushController>((ref) => PushController(ref.watch(apiProvider)));
