import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'push.dart';
import 'realtime.dart';
import 'token_store.dart';

final apiProvider = Provider<Api>((ref) => Api(tokens: TokenStore()));

/// Typed view over GET /v1/me.
class Me {
  Me(this.json);
  final Map<String, dynamic> json;

  String get id => json['id'] as String;
  String get status => json['status'] as String;
  String get role => json['role'] as String;
  bool get isTester => role == 'tester';
  int? get age => json['age'] as int?;
  String? get archetype => json['archetype'] as String?;
  int get invitesLeft => (json['invitesLeft'] as int?) ?? 0;
  Map<String, dynamic> get settings => (json['settings'] as Map).cast<String, dynamic>();
  Map<String, dynamic> get onboarding => (json['onboarding'] as Map).cast<String, dynamic>();
  Map<String, dynamic> get consents => (json['consents'] as Map).cast<String, dynamic>();
  bool get paywallEnabled => json['paywallEnabled'] == true;
  String get environment => json['environment'] as String? ?? '';
  bool get isActive => status == 'active';
}

enum Phase { loading, signedOut, signedIn }

class SessionState {
  const SessionState(this.phase, [this.me]);
  final Phase phase;
  final Me? me;
}

class SessionNotifier extends Notifier<SessionState> {
  @override
  SessionState build() {
    final api = ref.read(apiProvider);
    api.onSessionExpired = () => _expire();
    api.onTokenChanged = (t) => ref.read(realtimeProvider).connect(t);
    Future.microtask(_restore);
    return const SessionState(Phase.loading);
  }

  Api get _api => ref.read(apiProvider);

  Future<void> _restore() async {
    if (await _api.refresh()) {
      await reloadMe();
    } else {
      state = const SessionState(Phase.signedOut);
    }
  }

  Future<void> requestCode(String email) => _api.post('/v1/auth/code', {'email': email});

  Future<void> verify(String email, String code, {String? inviteCode}) async {
    final data = await _api.post<Map<String, dynamic>>('/v1/auth/verify', {
      'email': email,
      'code': code,
      if (inviteCode != null && inviteCode.isNotEmpty) 'inviteCode': inviteCode,
    });
    await _api.setTokens(data);
    await reloadMe();
    unawaited(ref.read(pushProvider).refresh().catchError((_) {}));
  }

  Future<Me> reloadMe() async {
    var json = await _api.get<Map<String, dynamic>>('/v1/me');
    // Keep the server-side locale (used for push texts and demo replies) in sync with the app language.
    if (json['locale'] != _api.locale && json['status'] != 'blocked_underage') {
      try {
        json = await _api.patch<Map<String, dynamic>>('/v1/me', {'locale': _api.locale});
      } catch (_) {}
    }
    // Server-side timezone drives the 12:00 daily set, quiet hours and the daily reminder cap.
    try {
      final tz = (await FlutterTimezone.getLocalTimezone()).identifier;
      if (tz.isNotEmpty && (json['settings'] as Map?)?['timezone'] != tz && json['status'] != 'blocked_underage') {
        json = await _api.patch<Map<String, dynamic>>('/v1/me', {'timezone': tz});
      }
    } catch (_) {}
    final me = Me(json);
    state = SessionState(Phase.signedIn, me);
    return me;
  }

  Future<void> signOut() async {
    try {
      await _api.post('/v1/auth/logout');
    } catch (_) {}
    await _clear();
  }

  Future<void> _clear() async {
    await _api.clear();
    ref.read(realtimeProvider).disconnect();
    state = const SessionState(Phase.signedOut);
  }

  void _expire() {
    if (state.phase == Phase.signedIn) _clear();
  }
}

final sessionProvider = NotifierProvider<SessionNotifier, SessionState>(SessionNotifier.new);

/// App language (en/ru), persisted locally; null = follow the device.
class LocaleNotifier extends Notifier<Locale?> {
  static const _key = 'ns_locale';

  @override
  Locale? build() {
    SharedPreferences.getInstance().then((p) {
      final code = p.getString(_key);
      if (code != null) state = Locale(code);
    }).catchError((_) {});
    return null;
  }

  Future<void> set(String code) async {
    state = Locale(code);
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_key, code);
    } catch (_) {}
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(LocaleNotifier.new);
