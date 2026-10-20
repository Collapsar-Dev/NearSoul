import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widgets/glass.dart';

/// Design tokens (PRD §5.10). Fixed status colours; the accent comes from the chosen [NsPalette].
class NsColors {
  static const success = Color(0xFF2E9E6B);
  static const warning = Color(0xFFD99A21);
  static const danger = Color(0xFFD64545);
}

/// Colour themes the person can pick in Settings. Violet (light lavender) is the default (CR-38).
enum NsPalette {
  violet(primary: Color(0xFF7C5CFC), primaryDark: Color(0xFFB5A3FF), soul: Color(0xFFE0569A), soulDark: Color(0xFFFF8CC0), bg: Color(0xFFF5F2FF), bgDark: Color(0xFF110E1C), surfaceDark: Color(0xFF1C1730)),
  neutral(primary: Color(0xFF3F4A5A), primaryDark: Color(0xFFAEB8C6), soul: Color(0xFF5B6475), soulDark: Color(0xFFB9C0CC), bg: Color(0xFFF6F6F4), bgDark: Color(0xFF121315), surfaceDark: Color(0xFF1C1D20)),
  sage(primary: Color(0xFF4F6F5F), primaryDark: Color(0xFF9CC2AE), soul: Color(0xFF5E6E66), soulDark: Color(0xFFB6C8BE), bg: Color(0xFFF5F6F3), bgDark: Color(0xFF111412), surfaceDark: Color(0xFF1A1E1B)),
  sand(primary: Color(0xFF7A6248), primaryDark: Color(0xFFD2B795), soul: Color(0xFF6B5E52), soulDark: Color(0xFFCDBFAF), bg: Color(0xFFF8F6F2), bgDark: Color(0xFF151311), surfaceDark: Color(0xFF1F1C19)),
  coral(primary: Color(0xFFE8636F), primaryDark: Color(0xFFF0848D), soul: Color(0xFF3B3B98), soulDark: Color(0xFF8C8CF0), bg: Color(0xFFFFFBF8), bgDark: Color(0xFF14131A), surfaceDark: Color(0xFF1E1C26));

  const NsPalette({required this.primary, required this.primaryDark, required this.soul, required this.soulDark, required this.bg, required this.bgDark, required this.surfaceDark});
  final Color primary;
  final Color primaryDark;
  final Color soul;
  final Color soulDark;
  final Color bg;
  final Color bgDark;
  final Color surfaceDark;
}

ThemeData buildTheme(Brightness b, [NsPalette p = NsPalette.violet]) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: p.primary,
    brightness: b,
    primary: dark ? p.primaryDark : p.primary,
    secondary: dark ? p.soulDark : p.soul,
    surface: dark ? p.surfaceDark : Colors.white,
    error: NsColors.danger,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: b);
  return base.copyWith(
    // Liquid Glass (CR-39): screens are transparent over the living background that travels with each page.
    scaffoldBackgroundColor: Colors.transparent,
    canvasColor: dark ? p.surfaceDark : const Color(0xFFFBF9FF),
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: LiquidPageTransitionsBuilder(),
      TargetPlatform.iOS: LiquidPageTransitionsBuilder(),
      TargetPlatform.macOS: LiquidPageTransitionsBuilder(),
      TargetPlatform.windows: LiquidPageTransitionsBuilder(),
      TargetPlatform.linux: LiquidPageTransitionsBuilder(),
      TargetPlatform.fuchsia: LiquidPageTransitionsBuilder(),
    }),
    appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, surfaceTintColor: Colors.transparent, elevation: 0, scrolledUnderElevation: 0, centerTitle: false),
    cardTheme: CardThemeData(
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      color: dark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.62),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28), side: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.14 : 0.8), width: 1.2)),
      margin: EdgeInsets.zero,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(64, 54), shape: const StadiumBorder(), elevation: 0, textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(64, 54),
        shape: const StadiumBorder(),
        backgroundColor: Colors.white.withValues(alpha: dark ? 0.06 : 0.5),
        side: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.25 : 0.9), width: 1.2),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(shape: const StadiumBorder())),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.2 : 0.9))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.2 : 0.9))),
      filled: true,
      fillColor: Colors.white.withValues(alpha: dark ? 0.07 : 0.6),
    ),
    chipTheme: base.chipTheme.copyWith(
      shape: StadiumBorder(side: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.2 : 0.85))),
      backgroundColor: Colors.white.withValues(alpha: dark ? 0.08 : 0.55),
      side: BorderSide(color: Colors.white.withValues(alpha: dark ? 0.2 : 0.85)),
    ),
    listTileTheme: const ListTileThemeData(tileColor: Colors.transparent),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: dark ? p.surfaceDark.withValues(alpha: 0.96) : const Color(0xFFFBF9FF).withValues(alpha: 0.97),
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
    ),
    dialogTheme: DialogThemeData(backgroundColor: dark ? p.surfaceDark : const Color(0xFFFBF9FF), surfaceTintColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32))),
    navigationBarTheme: NavigationBarThemeData(backgroundColor: Colors.transparent, surfaceTintColor: Colors.transparent, indicatorColor: scheme.primary.withValues(alpha: dark ? 0.35 : 0.18), elevation: 0),
    navigationRailTheme: NavigationRailThemeData(backgroundColor: Colors.transparent, indicatorColor: scheme.primary.withValues(alpha: dark ? 0.35 : 0.18)),
    snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
    textTheme: base.textTheme.copyWith(
      headlineMedium: base.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineSmall: base.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
      titleLarge: base.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
    ),
  );
}

/// Appearance chosen in Settings, kept on this device.
/// App logo variants (CR-24): 1 is the main mark; 2 and 4 can be picked in Settings → Appearance.
enum NsLogoVariant {
  soul('assets/logo.png', 'icons/favicon-1.png'),
  pair('assets/logo_2.png', 'icons/favicon-2.png'),
  heart('assets/logo_4.png', 'icons/favicon-4.png');

  const NsLogoVariant(this.asset, this.favicon);
  final String asset;
  final String favicon;
}

/// Appearance chosen in Settings, kept on this device.
class Appearance {
  const Appearance({this.mode = ThemeMode.light, this.palette = NsPalette.violet, this.logo = NsLogoVariant.soul});
  final ThemeMode mode;
  final NsPalette palette;
  final NsLogoVariant logo;

  Appearance copyWith({ThemeMode? mode, NsPalette? palette, NsLogoVariant? logo}) => Appearance(mode: mode ?? this.mode, palette: palette ?? this.palette, logo: logo ?? this.logo);
}

class AppearanceNotifier extends Notifier<Appearance> {
  // v2 keys: the violet light theme became the default (CR-38); older saved choices start fresh once.
  static const _modeKey = 'ns_theme_mode_v2';
  static const _paletteKey = 'ns_theme_palette_v2';
  static const _logoKey = 'ns_logo';

  /// Set by the web build to swap the browser-tab icon.
  static void Function(String href)? onLogoChanged;

  @override
  Appearance build() {
    SharedPreferences.getInstance().then((p) {
      final mode = ThemeMode.values.where((m) => m.name == p.getString(_modeKey)).firstOrNull;
      final palette = NsPalette.values.where((v) => v.name == p.getString(_paletteKey)).firstOrNull;
      final logo = NsLogoVariant.values.where((v) => v.name == p.getString(_logoKey)).firstOrNull;
      if (mode != null || palette != null || logo != null) state = state.copyWith(mode: mode, palette: palette, logo: logo);
      if (logo != null) onLogoChanged?.call(logo.favicon);
    }).catchError((_) {});
    return const Appearance();
  }

  Future<void> setMode(ThemeMode mode) async {
    state = state.copyWith(mode: mode);
    try {
      await (await SharedPreferences.getInstance()).setString(_modeKey, mode.name);
    } catch (_) {}
  }

  Future<void> setPalette(NsPalette palette) async {
    state = state.copyWith(palette: palette);
    try {
      await (await SharedPreferences.getInstance()).setString(_paletteKey, palette.name);
    } catch (_) {}
  }

  Future<void> setLogo(NsLogoVariant logo) async {
    state = state.copyWith(logo: logo);
    onLogoChanged?.call(logo.favicon);
    try {
      await (await SharedPreferences.getInstance()).setString(_logoKey, logo.name);
    } catch (_) {}
  }
}

final appearanceProvider = NotifierProvider<AppearanceNotifier, Appearance>(AppearanceNotifier.new);

/// Serif accent for archetype names.
TextStyle archetypeStyle(BuildContext context) =>
    Theme.of(context).textTheme.headlineMedium!.copyWith(fontFamily: 'serif', fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.secondary);
