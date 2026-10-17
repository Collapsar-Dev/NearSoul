import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../onboarding/quick_scan_screen.dart';
import '../../core/widgets/common.dart';
import '../matches/safety_actions.dart';
import '../me/paywall.dart';
import '../shell.dart';
import 'profile_widgets.dart';

/// S17 Today's Souls: a small curated daily set (ENG-014).
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  Map<String, dynamic>? _set;
  Object? _error;
  final Set<String> _acted = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final s = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/daily-set');
      setState(() {
        _set = s;
        _acted
          ..clear()
          ..addAll((s['cards'] as List).where((c) => c['action'] != null).map((c) => c['id'] as String));
      });
    } catch (e) {
      setState(() => _error = e);
    }
  }

  List<Map<String, dynamic>> get _remaining => ((_set?['cards'] as List?) ?? []).cast<Map<String, dynamic>>().where((c) => !_acted.contains(c['id'])).toList();

  Future<void> _act(Map<String, dynamic> p, String action) async {
    try {
      final r = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/likes', {'targetId': p['id'], 'action': action, 'source': 'daily'});
      setState(() => _acted.add(p['id'] as String));
      if (action == 'pass' && mounted) _offerRewind();
      final match = r['match'] as Map<String, dynamic>?;
      if (match != null && mounted) await showMatchDialog(context, person: p, matchId: match['id'] as String, nearby: match['nearby'] == true);
    } on ApiError catch (e) {
      if (!mounted) return;
      if (e.code == 'LIKE_LIMIT') {
        showSnack(context, context.l.likeLimit);
      } else if (e.status == 404) {
        setState(() => _acted.add(p['id'] as String)); // no longer available
      } else {
        showSnack(context, errorText(context, e));
      }
    }
  }

  /// "Undo" after a pass (CR-18): Gold and VIP get the person back; others see the levels.
  void _offerRewind() {
    final l = context.l;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(l.passed),
        action: SnackBarAction(
          label: l.rewind,
          onPressed: () async {
            try {
              final r = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/likes/rewind');
              setState(() => _acted.remove(r['targetId']));
              if (mounted) showSnack(context, l.rewindDone);
            } on ApiError catch (e) {
              if (!mounted) return;
              if (e.code == 'UPGRADE_REQUIRED') {
                await showPaywall(context);
                await _load();
              } else {
                showSnack(context, errorText(context, e));
              }
            }
          },
        ),
      ));
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final remaining = _remaining;
    return Scaffold(
      appBar: AppBar(
        title: NsTitle(l.todayTitle),
        actions: [
          if (_set != null) Center(child: Padding(padding: const EdgeInsets.only(right: 8), child: Text(l.todayLeft(remaining.length)))),
          IconButton(tooltip: l.notifications, icon: const Icon(Icons.notifications_none), onPressed: () => context.push('/me/notifications')),
        ],
      ),
      body: _error != null
          ? ErrorState(error: _error!, onRetry: _load)
          : _set == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(onRefresh: _load, child: remaining.isEmpty ? _empty(context) : _content(context, remaining.first)),
    );
  }

  Widget _empty(BuildContext context) {
    final l = context.l;
    final total = (_set!['cards'] as List).length;
    if (total == 0 && _set!['needsAnswers'] == true) {
      return ListView(children: [
        const SizedBox(height: 80),
        EmptyState(
          icon: Icons.quiz_outlined,
          text: l.todayNeedsAnswers,
          action: FilledButton(
            onPressed: () async {
              // Re-open the Quick Scan with earlier answers kept; skipped questions can be answered now.
              await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const QuickScanScreen(retake: true)));
              await _load();
            },
            child: Text(l.answerQuestions),
          ),
        ),
      ]);
    }
    return ListView(children: [
      const SizedBox(height: 80),
      EmptyState(
        icon: total == 0 ? Icons.travel_explore : Icons.nights_stay_outlined,
        text: total == 0 ? l.todayEmpty : l.todayDone,
        action: OutlinedButton(onPressed: () => context.go('/nearby'), child: Text(l.tryNearby)),
      ),
      if (total > 0) ...[
        const SizedBox(height: 24),
        FocusColumn(
          child: Column(children: [
            Text(l.moreSoulsUpsell, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: () async {
                await showPaywall(context);
                await _load();
              },
              child: Text(l.seePlans),
            ),
          ]),
        ),
      ],
    ]);
  }

  Widget _content(BuildContext context, Map<String, dynamic> p) {
    final actions = LikePassBar(onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'));
    Future<void> report() => reportFlow(context, ref, userId: p['id'] as String, name: p['firstName'] as String, onDone: () => setState(() => _acted.add(p['id'] as String)));
    Future<void> block() => blockFlow(context, ref, userId: p['id'] as String, name: p['firstName'] as String, onDone: () => setState(() => _acted.add(p['id'] as String)));
    if (sizeClassOf(context) == SizeClass.expanded) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 440, child: Column(children: [SoulCard(p: p), const SizedBox(height: 20), actions])),
          const SizedBox(width: 32),
          Expanded(child: SingleChildScrollView(child: ProfileDetails(p: p, showPhotos: false, onReport: report, onBlock: block))),
        ]),
      );
    }
    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: [
      FocusColumn(
        padding: EdgeInsets.zero,
        child: Column(children: [
          SoulCard(p: p, onTap: () => context.push('/today/profile/${p['id']}')),
          const SizedBox(height: 20),
          actions,
          const SizedBox(height: 24),
          ProfileDetails(p: p, showPhotos: false, onReport: report, onBlock: block),
        ]),
      ),
    ]);
  }
}
