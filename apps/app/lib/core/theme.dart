import 'package:flutter/material.dart';

/// Design tokens (PRD §5.10).
class NsColors {
  static const primary = Color(0xFFE8636F);
  static const primaryDark = Color(0xFFF0848D);
  static const soul = Color(0xFF3B3B98);
  static const soulDark = Color(0xFF8C8CF0);
  static const bg = Color(0xFFFFFBF8);
  static const bgDark = Color(0xFF14131A);
  static const surfaceDark = Color(0xFF1E1C26);
  static const success = Color(0xFF2E9E6B);
  static const warning = Color(0xFFD99A21);
  static const danger = Color(0xFFD64545);
}

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: NsColors.primary,
    brightness: b,
    primary: dark ? NsColors.primaryDark : NsColors.primary,
    secondary: dark ? NsColors.soulDark : NsColors.soul,
    surface: dark ? NsColors.surfaceDark : Colors.white,
    error: NsColors.danger,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: b);
  return base.copyWith(
    scaffoldBackgroundColor: dark ? NsColors.bgDark : NsColors.bg,
    appBarTheme: AppBarTheme(backgroundColor: dark ? NsColors.bgDark : NsColors.bg, elevation: 0, scrolledUnderElevation: 0, centerTitle: false),
    cardTheme: CardThemeData(elevation: 0, color: scheme.surface, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), margin: EdgeInsets.zero),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(64, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size(64, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    ),
    inputDecorationTheme: InputDecorationTheme(border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)), filled: true, fillColor: scheme.surface),
    chipTheme: base.chipTheme.copyWith(shape: const StadiumBorder()),
    textTheme: base.textTheme.copyWith(
      headlineMedium: base.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineSmall: base.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
      titleLarge: base.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
    ),
  );
}

/// Serif accent for archetype names.
TextStyle archetypeStyle(BuildContext context) =>
    Theme.of(context).textTheme.headlineMedium!.copyWith(fontFamily: 'serif', fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.secondary);
