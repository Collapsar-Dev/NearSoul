/// Build-time configuration (pass with --dart-define).
class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');
  static const appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'development');
  static const version = String.fromEnvironment('APP_VERSION', defaultValue: '0.1.0');
  static const build = String.fromEnvironment('BUILD_NUMBER', defaultValue: 'dev');

  static bool get isAlpha => appEnv == 'alpha';
  static bool get showTestTools => appEnv == 'alpha' || appEnv == 'development';
}
