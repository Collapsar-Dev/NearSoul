import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'platform/http_adapter_stub.dart' if (dart.library.js_interop) 'platform/http_adapter_web.dart';

/// Refresh-token persistence (D35): Keychain/Keystore on native, an httpOnly cookie on web (never localStorage).
class TokenStore {
  static const _key = 'ns_refresh';
  final _storage = const FlutterSecureStorage();

  Future<String?> readRefresh() async => isWebPlatform ? null : _storage.read(key: _key);

  Future<void> writeRefresh(String? token) async {
    if (isWebPlatform || token == null) return;
    await _storage.write(key: _key, value: token);
  }

  Future<void> clear() async {
    if (!isWebPlatform) await _storage.delete(key: _key);
  }
}
