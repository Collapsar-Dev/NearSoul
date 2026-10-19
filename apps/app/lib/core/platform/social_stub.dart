/// Native builds: social sign-in needs the platform SDKs (google_sign_in, sign_in_with_apple, VK ID) — next step.
const socialSupported = false;

void preloadApple() {}

Future<Map<String, dynamic>> socialAuthorize(String provider, String clientId) async => throw UnsupportedError('native');
