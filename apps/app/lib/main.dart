import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'core/push.dart';
import 'core/router.dart';
import 'core/session.dart';
import 'core/platform/icon_stub.dart' if (dart.library.js_interop) 'core/platform/icon_web.dart';
import 'core/theme.dart';
import 'l10n/gen/app_localizations.dart';

void main() {
  usePathUrlStrategy(); // PLAT-003: path URLs on web (no #)
  AppearanceNotifier.onLogoChanged = setBrowserIcon;
  runApp(const ProviderScope(child: NearSoulApp()));
  // Desktop web: always build the semantics tree so screen readers (and browser automation) see real elements (§5.7, §16.4).
  // Not on phones: forced semantics makes taps on text fields land on the semantics layer, so the keyboard sometimes
  // doesn't open. Mobile screen readers still turn semantics on through Flutter's accessibility placeholder.
  final phone = defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.android;
  if (kIsWeb && !phone) SemanticsBinding.instance.ensureSemantics();
}

class NearSoulApp extends ConsumerStatefulWidget {
  const NearSoulApp({super.key});

  @override
  ConsumerState<NearSoulApp> createState() => _NearSoulAppState();
}

class _NearSoulAppState extends ConsumerState<NearSoulApp> {
  @override
  void initState() {
    super.initState();
    // A tapped push notification while the app is open: go to the screen it is about.
    PushController.onOpen((path) => ref.read(routerProvider).go(path));
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeProvider);
    final look = ref.watch(appearanceProvider);
    return MaterialApp.router(
      title: 'NearSoul',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light, look.palette),
      darkTheme: buildTheme(Brightness.dark, look.palette),
      themeMode: look.mode,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [AppLocalizations.delegate, GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      localeResolutionCallback: (device, supported) {
        final code = (locale ?? device)?.languageCode;
        final resolved = supported.firstWhere((l) => l.languageCode == code, orElse: () => const Locale('en'));
        ref.read(apiProvider).locale = resolved.languageCode;
        return resolved;
      },
      routerConfig: router,
      // Lists and feeds can also be dragged with a mouse, like on a phone.
      scrollBehavior: const MaterialScrollBehavior().copyWith(dragDevices: {PointerDeviceKind.touch, PointerDeviceKind.mouse, PointerDeviceKind.trackpad, PointerDeviceKind.stylus}),
    );
  }
}
