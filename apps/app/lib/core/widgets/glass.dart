import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// Liquid Glass (CR-39, iOS 26 style): translucent, blurred surfaces with a bright rim and a soft specular highlight,
/// floating above a living lavender/pink background. Blur is used only on a few surfaces (navigation, card captions,
/// round buttons) to stay fast on the web and on low-end phones.
class Glass extends StatelessWidget {
  const Glass({super.key, required this.child, this.radius = 28, this.padding, this.blur = 18, this.tint, this.shape, this.onPhoto = false});
  final Widget child;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final double blur;
  /// Optional colour wash (e.g. the like button's gradient sits on top instead).
  final Color? tint;
  final BoxShape? shape;
  /// Darker glass for captions over photos, so white text stays readable.
  final bool onPhoto;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final circle = shape == BoxShape.circle;
    final border = circle ? null : BorderRadius.circular(radius);
    final decoration = BoxDecoration(
      shape: shape ?? BoxShape.rectangle,
      borderRadius: border,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: tint != null
            ? [tint!.withValues(alpha: 0.75), tint!.withValues(alpha: 0.55)]
            : onPhoto
                ? [const Color(0xFF1B1030).withValues(alpha: 0.42), const Color(0xFF1B1030).withValues(alpha: 0.22), const Color(0xFF1B1030).withValues(alpha: 0.38)]
                : dark
                ? [Colors.white.withValues(alpha: 0.16), Colors.white.withValues(alpha: 0.05), Colors.white.withValues(alpha: 0.10)]
                : [Colors.white.withValues(alpha: 0.62), Colors.white.withValues(alpha: 0.28), Colors.white.withValues(alpha: 0.45)],
      ),
      border: Border.all(color: Colors.white.withValues(alpha: onPhoto ? 0.35 : dark ? 0.22 : 0.75), width: 1.2),
      boxShadow: [BoxShadow(color: const Color(0xFF4A2BA8).withValues(alpha: dark ? 0.35 : 0.14), blurRadius: 24, offset: const Offset(0, 10))],
    );
    final content = Stack(children: [
      // Specular highlight along the top edge, like light caught in glass.
      Positioned(
        left: 0,
        right: 0,
        top: 0,
        height: 22,
        child: IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.white.withValues(alpha: onPhoto ? 0.16 : dark ? 0.18 : 0.55), Colors.white.withValues(alpha: 0)]),
            ),
          ),
        ),
      ),
      Padding(padding: padding ?? EdgeInsets.zero, child: child),
    ]);
    final clip = circle ? ClipOval(child: _blurred(content, decoration)) : ClipRRect(borderRadius: border!, child: _blurred(content, decoration));
    return DecoratedBox(
      decoration: BoxDecoration(shape: shape ?? BoxShape.rectangle, borderRadius: border, boxShadow: decoration.boxShadow),
      child: clip,
    );
  }

  Widget _blurred(Widget content, BoxDecoration d) => BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: DecoratedBox(decoration: d.copyWith(boxShadow: const []), child: content),
      );
}

/// The soft "aurora" background every screen floats on.
class LiquidBackground extends StatelessWidget {
  const LiquidBackground({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final base = dark ? const Color(0xFF0F0B1C) : const Color(0xFFEFE7FF);
    Widget blob(Alignment a, Color c, double size) => Align(
          alignment: a,
          child: IgnorePointer(
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [c.withValues(alpha: dark ? 0.55 : 0.95), c.withValues(alpha: dark ? 0.18 : 0.35), c.withValues(alpha: 0)], stops: const [0, 0.55, 1])),
            ),
          ),
        );
    return ColoredBox(
      color: base,
      child: Stack(children: [
        Positioned.fill(
          child: LayoutBuilder(builder: (context, c) {
            final s = c.biggest.shortestSide * 1.3;
            return Stack(children: [
              blob(const Alignment(-1.1, -1.0), const Color(0xFFB59CFF), s),
              blob(const Alignment(1.25, -0.35), const Color(0xFFFFA8CF), s * 0.95),
              blob(const Alignment(-0.7, 1.15), const Color(0xFF9DBEFF), s * 1.05),
              blob(const Alignment(1.1, 1.1), const Color(0xFFD3A6FF), s * 0.8),
            ]);
          }),
        ),
        Positioned.fill(child: child),
      ]),
    );
  }
}

/// Page transition that carries the background with each page, so translucent screens never show the page below.
class LiquidPageTransitionsBuilder extends PageTransitionsBuilder {
  const LiquidPageTransitionsBuilder();
  static const _inner = FadeUpwardsPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(PageRoute<T> route, BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) =>
      _inner.buildTransitions(route, context, animation, secondaryAnimation, LiquidBackground(child: child));
}
