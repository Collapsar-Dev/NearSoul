import 'package:flutter/foundation.dart';

/// Build-time configuration (pass with --dart-define).
class AppConfig {
  static const _apiUrl = String.fromEnvironment('API_URL');

  /// Explicit API_URL wins; on web without it the app talks to its own origin (API serves the web build).
  static String get apiUrl => _apiUrl.isNotEmpty ? _apiUrl : (kIsWeb ? Uri.base.origin : 'http://localhost:3000');
  static const appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'development');
  static const version = String.fromEnvironment('APP_VERSION', defaultValue: '0.1.0');
  static const build = String.fromEnvironment('BUILD_NUMBER', defaultValue: 'dev');

  static bool get isAlpha => appEnv == 'alpha';
  static bool get showTestTools => appEnv == 'alpha' || appEnv == 'development';
}
