import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/config.dart';
import '../core/responsive.dart';
import '../core/widgets/common.dart';

/// Adaptive navigation (PRD §5.4, §5.9): bottom bar on phones, rail on tablets, extended rail on desktop.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final items = [
      (Icons.wb_sunny_outlined, Icons.wb_sunny, l.tabToday),
      (Icons.radar_outlined, Icons.radar, l.tabNearby),
      (Icons.auto_awesome_outlined, Icons.auto_awesome, l.tabSoul),
      (Icons.chat_bubble_outline, Icons.chat_bubble, l.tabMatches),
      (Icons.person_outline, Icons.person, l.tabMe),
    ];
    void go(int i) => shell.goBranch(i, initialLocation: i == shell.currentIndex);
    final size = sizeClassOf(context);
    final alpha = AppConfig.isAlpha || AppConfig.appEnv == 'development';
    if (size == SizeClass.compact) {
      return Scaffold(
        body: shell,
        bottomNavigationBar: NavigationBar(
          selectedIndex: shell.currentIndex,
          onDestinationSelected: go,
          destinations: [for (final i in items) NavigationDestination(icon: Icon(i.$1), selectedIcon: Icon(i.$2), label: i.$3)],
        ),
      );
    }
    final extended = MediaQuery.sizeOf(context).width >= 1280;
    return Scaffold(
      body: Row(children: [
        NavigationRail(
          extended: extended,
          labelType: extended ? NavigationRailLabelType.none : NavigationRailLabelType.all,
          selectedIndex: shell.currentIndex,
          onDestinationSelected: go,
          leading: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.favorite, color: Theme.of(context).colorScheme.primary),
              if (extended) ...[const SizedBox(width: 8), Text('NearSoul', style: Theme.of(context).textTheme.titleLarge), const TestBadge()],
            ]),
          ),
          trailing: alpha
              ? Expanded(
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: IconButton(tooltip: l.sendFeedback, icon: const Icon(Icons.rate_review_outlined), onPressed: () => context.push('/me/feedback')),
                    ),
                  ),
                )
              : null,
          destinations: [for (final i in items) NavigationRailDestination(icon: Icon(i.$1), selectedIcon: Icon(i.$2), label: Text(i.$3))],
        ),
        const VerticalDivider(width: 1),
        Expanded(child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1440), child: shell))),
      ]),
    );
  }
}

/// App bar title with the test-version badge.
class NsTitle extends StatelessWidget {
  const NsTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [Flexible(child: Text(text, overflow: TextOverflow.ellipsis)), const TestBadge()]);
}
