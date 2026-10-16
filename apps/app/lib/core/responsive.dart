import 'package:flutter/widgets.dart';

/// PRD §5.9 breakpoints.
enum SizeClass { compact, medium, expanded }

SizeClass sizeClassOf(BuildContext context) {
  final w = MediaQuery.sizeOf(context).width;
  if (w < 600) return SizeClass.compact;
  if (w < 1024) return SizeClass.medium;
  return SizeClass.expanded;
}

/// Centred column with a max width (focus screens: Quick Scan, paywall, forms).
class FocusColumn extends StatelessWidget {
  const FocusColumn({super.key, required this.child, this.maxWidth = 560, this.padding = const EdgeInsets.symmetric(horizontal: 20)});
  final Widget child;
  final double maxWidth;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Center(
        child: ConstrainedBox(constraints: BoxConstraints(maxWidth: maxWidth), child: Padding(padding: padding, child: child)),
      );
}
