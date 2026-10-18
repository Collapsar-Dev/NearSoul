import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/gen/app_localizations.dart';
import '../api.dart';
import '../config.dart';

extension L10nX on BuildContext {
  AppLocalizations get l => AppLocalizations.of(this);
}

/// Human message for an error (never raw internals).
String errorText(BuildContext context, Object e) {
  if (e is ApiError) {
    if (e.isNetwork) return context.l.offline;
    if (e.code == 'RATE_LIMITED') return context.l.rateLimited;
    return e.message;
  }
  return context.l.somethingWrong;
}

void showSnack(BuildContext context, String text) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text), behavior: SnackBarBehavior.floating));
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.error, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 12),
            Text(errorText(context, error), textAlign: TextAlign.center),
            if (onRetry != null) ...[const SizedBox(height: 12), OutlinedButton(onPressed: onRetry, child: Text(context.l.retry))],
          ]),
        ),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.text, this.action});
  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 56, color: Theme.of(context).colorScheme.secondary.withValues(alpha: 0.6)),
            const SizedBox(height: 16),
            Text(text, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

/// Async builder with loading / error states.
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({super.key, required this.future, required this.builder, this.onRetry});
  final Future<T> future;
  final Widget Function(BuildContext, T) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
        future: future,
        builder: (context, snap) {
          if (snap.hasError) return ErrorState(error: snap.error!, onRetry: onRetry);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          return builder(context, snap.data as T);
        },
      );
}

/// Button that disables itself while its async action runs (double-tap protection, PRD §5.7).
class BusyButton extends StatefulWidget {
  const BusyButton({super.key, required this.label, required this.onPressed, this.outlined = false, this.icon});
  final String label;
  final Future<void> Function()? onPressed;
  final bool outlined;
  final IconData? icon;

  @override
  State<BusyButton> createState() => _BusyButtonState();
}

class _BusyButtonState extends State<BusyButton> {
  bool _busy = false;

  Future<void> _run() async {
    if (_busy || widget.onPressed == null) return;
    setState(() => _busy = true);
    try {
      await widget.onPressed!();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = _busy
        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
        : Row(mainAxisSize: MainAxisSize.min, children: [if (widget.icon != null) ...[Icon(widget.icon, size: 20), const SizedBox(width: 8)], Text(widget.label)]);
    final onPressed = widget.onPressed == null || _busy ? null : _run;
    return widget.outlined ? OutlinedButton(onPressed: onPressed, child: child) : FilledButton(onPressed: onPressed, child: child);
  }
}

/// "TEST" badge (ALPHA-007). Tapping it opens the feedback form (ALPHA-004) from any main screen.
class TestBadge extends StatelessWidget {
  const TestBadge({super.key});

  @override
  Widget build(BuildContext context) {
    if (!AppConfig.isAlpha && AppConfig.appEnv != 'development') return const SizedBox.shrink();
    return Tooltip(
      message: context.l.sendFeedback,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: () => GoRouter.of(context).push('/me/feedback'),
        child: Container(
          margin: const EdgeInsets.only(left: 8),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: Colors.amber.shade700, borderRadius: BorderRadius.circular(999)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(context.l.testVersion, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            const SizedBox(width: 4),
            const Icon(Icons.rate_review_outlined, size: 12, color: Colors.white),
          ]),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 20, bottom: 8),
        child: Text(text, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      );
}

class TierChip extends StatelessWidget {
  const TierChip(this.tier, {super.key, this.onDark = false});
  final String tier;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final (label, color) = switch (tier) {
      'strong' => (l.tierStrong, const Color(0xFF2E9E6B)),
      'good' => (l.tierGood, Theme.of(context).colorScheme.secondary),
      'some' => (l.tierSome, const Color(0xFFD99A21)),
      _ => (l.tierLow, Theme.of(context).colorScheme.outline),
    };
    final fg = onDark ? Colors.white : color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: onDark ? Colors.white.withValues(alpha: 0.22) : color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.auto_awesome, size: 14, color: fg),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 13)),
      ]),
    );
  }
}

class DemoBadge extends StatelessWidget {
  const DemoBadge({super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(999)),
        child: Text(context.l.demoBadge, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      );
}

/// The NearSoul mark: a friendly soul (ghost) holding a heart. Decorative next to the wordmark.
class NsLogo extends ConsumerWidget {
  const NsLogo({super.key, this.size = 28});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) => ExcludeSemantics(
        child: Image.asset(ref.watch(appearanceProvider).logo.asset, width: size, height: size, filterQuality: FilterQuality.medium),
      );
}
