import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
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
  /// Cards (swipe one by one) or a scrollable list of everyone today; remembered on this device.
  bool _list = false;
  static const _viewKey = 'ns_today_view';
  /// One-time "swipe right to like" hint for card mode.
  bool _showSwipeHint = false;
  static const _hintKey = 'ns_swipe_hint_seen';
  /// Sponsored cards (CR-25): empty for Gold/VIP. An ad shows after every [_adEvery] people.
  List<Map<String, dynamic>> _ads = [];
  int _adEvery = 10;
  final Set<int> _adsShownAt = {};
  final Set<String> _adsCounted = {};

  Future<void> _loadAds() async {
    try {
      final r = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/ads');
      if (mounted) {
        setState(() {
          _ads = (r['ads'] as List).cast<Map<String, dynamic>>();
          _adEvery = (r['every'] as int?) ?? 10;
        });
      }
    } catch (_) {}
  }

  void _countAd(Map<String, dynamic> ad, String kind) {
    if (kind == 'impression' && !_adsCounted.add(ad['id'] as String)) return;
    ref.read(apiProvider).post('/v1/ads/${ad['id']}/$kind').catchError((_) => null);
  }

  Future<void> _openAd(Map<String, dynamic> ad) async {
    _countAd(ad, 'click');
    await launchUrl(Uri.parse(ad['url'] as String), mode: LaunchMode.externalApplication);
  }

  Widget _adCard(Map<String, dynamic> ad, {VoidCallback? onClose}) {
    _countAd(ad, 'impression');
    return AdCardView(ad: ad, onOpen: () => _openAd(ad), onClose: onClose ?? () {});
  }

  /// Card mode: after every N people decided today, one ad sits in the stack until closed or swiped away.
  bool get _adDue => _ads.isNotEmpty && _acted.isNotEmpty && _acted.length % _adEvery == 0 && !_adsShownAt.contains(_acted.length);

  /// Gentle "keep discovering yourself" nudge: after a few cards, at most once a day, while questions remain.
  int _refineRemaining = 0;
  bool _nudgeDismissedToday = true;
  static const _nudgeKey = 'ns_refine_nudge_day';
  String get _today => DateTime.now().toIso8601String().substring(0, 10);

  @override
  void initState() {
    super.initState();
    _load();
    _loadRefine();
    _loadAds();
    SharedPreferences.getInstance().then((p) {
      if (!mounted) return;
      setState(() {
        _list = p.getString(_viewKey) == 'list';
        _showSwipeHint = p.getBool(_hintKey) != true;
        _nudgeDismissedToday = p.getString(_nudgeKey) == _today;
      });
    }).catchError((_) {});
  }

  Future<void> _loadRefine() async {
    try {
      final pr = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/engine/progress');
      if (mounted) setState(() => _refineRemaining = (pr['refineRemaining'] as int?) ?? 0);
    } catch (_) {}
  }

  bool get _showNudge => _refineRemaining > 0 && !_nudgeDismissedToday && _acted.length >= 3;

  void _dismissNudge() {
    setState(() => _nudgeDismissedToday = true);
    SharedPreferences.getInstance().then((p) => p.setString(_nudgeKey, _today)).catchError((_) => true);
  }

  Widget _refineNudge(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
      decoration: BoxDecoration(color: scheme.tertiaryContainer, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Icon(Icons.auto_awesome, color: scheme.onTertiaryContainer),
        const SizedBox(width: 10),
        Expanded(child: Text(context.l.refineNudge(_refineRemaining), style: TextStyle(color: scheme.onTertiaryContainer))),
        Column(mainAxisSize: MainAxisSize.min, children: [
          TextButton(
            onPressed: () async {
              _dismissNudge();
              await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const QuickScanScreen(refine: true)));
              await _loadRefine();
            },
            child: Text(context.l.refineNudgeCta),
          ),
          IconButton(tooltip: MaterialLocalizations.of(context).closeButtonTooltip, icon: const Icon(Icons.close, size: 18), onPressed: _dismissNudge),
        ]),
      ]),
    );
  }

  void _hideSwipeHint() {
    setState(() => _showSwipeHint = false);
    SharedPreferences.getInstance().then((p) => p.setBool(_hintKey, true)).catchError((_) => true);
  }

  Widget _swipeHint(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(14, 8, 4, 8),
      decoration: BoxDecoration(color: scheme.secondaryContainer, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Icon(Icons.swipe_outlined, color: scheme.onSecondaryContainer),
        const SizedBox(width: 10),
        Expanded(child: Text(context.l.swipeHint, style: TextStyle(color: scheme.onSecondaryContainer))),
        TextButton(onPressed: _hideSwipeHint, child: Text(context.l.gotIt)),
      ]),
    );
  }

  /// VIP: write first. Opens the chat right away if the other side already accepted (alpha demos).
  Future<void> _writeFirst(Map<String, dynamic> p) async {
    final matchId = await writeFirstFlow(context, ref, userId: p['id'] as String, name: p['firstName'] as String);
    if (!mounted) return;
    setState(() => _acted.add(p['id'] as String));
    if (matchId != null) context.go('/matches/$matchId');
  }

  /// Full profile with its own pass/like; the choice comes back here and is sent like any other.
  Future<void> _openProfile(Map<String, dynamic> p) async {
    final choice = await context.push<String>('/today/profile/${p['id']}?act=1');
    if (choice == 'like' || choice == 'pass') await _act(p, choice!);
  }

  void _setView(bool list) {
    setState(() => _list = list);
    SharedPreferences.getInstance().then((p) => p.setString(_viewKey, list ? 'list' : 'cards')).catchError((_) => true);
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
      if (_showSwipeHint) _hideSwipeHint();
      if (action == 'pass' && mounted) _offerRewind();
      final match = r['match'] as Map<String, dynamic>?;
      if (match != null && mounted) await showMatchDialog(context, person: p, matchId: match['id'] as String, nearby: match['nearby'] == true);
    } on ApiError catch (e) {
      if (!mounted) return;
      if (e.code == 'LIKE_LIMIT') {
        showSnack(context, context.l.likeLimit);
      } else if (e.status == 404) {
        setState(() => _acted.add(p['id'] as String)); // no longer available
        showSnack(context, context.l.personGone);
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
          if (_set != null) Center(child: Padding(padding: const EdgeInsets.only(right: 4), child: Text(l.todayLeft(remaining.length)))),
          IconButton(
            tooltip: _list ? l.viewCards : l.viewList,
            icon: Icon(_list ? Icons.style_outlined : Icons.view_agenda_outlined),
            onPressed: () => _setView(!_list),
          ),
          IconButton(tooltip: l.notifications, icon: const Icon(Icons.notifications_none), onPressed: () => context.push('/me/notifications')),
        ],
      ),
      body: _error != null
          ? ErrorState(error: _error!, onRetry: _load)
          : _set == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(onRefresh: _load, child: remaining.isEmpty ? _empty(context) : _list ? _feed(context, remaining) : _adDue ? _adInStack(context) : _content(context, remaining.first)),
    );
  }

  Widget _empty(BuildContext context) {
    final l = context.l;
    final total = (_set!['cards'] as List).length;
    final blocked = _set!['viewerBlocked'] as String?;
    if (total == 0 && (blocked == 'NOT_DISCOVERABLE' || blocked == 'PHOTOS')) {
      return ListView(children: [
        const SizedBox(height: 80),
        EmptyState(
          icon: blocked == 'PHOTOS' ? Icons.add_a_photo_outlined : Icons.visibility_off_outlined,
          text: blocked == 'PHOTOS' ? l.todayNeedsPhoto : l.todayHidden,
          action: FilledButton(
            onPressed: () async {
              if (blocked == 'PHOTOS') {
                await context.push('/me/photos');
              } else {
                await ref.read(apiProvider).patch('/v1/me', {'discoveryEnabled': true});
                await ref.read(sessionProvider.notifier).reloadMe();
              }
              await _load();
            },
            child: Text(blocked == 'PHOTOS' ? l.addPhoto2 : l.showMe),
          ),
        ),
      ]);
    }
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
      if (total > 0 && _ads.isNotEmpty) ...[
        const SizedBox(height: 24),
        FocusColumn(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 360), child: _adCard(_ads.first, onClose: () => setState(() => _ads = [])))),
      ],
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
          SizedBox(width: 440, child: Column(children: [SwipeCard(key: ValueKey(p['id']), onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'), child: SoulCard(p: p)), const SizedBox(height: 20), actions])),
          const SizedBox(width: 32),
          Expanded(child: SingleChildScrollView(child: ProfileDetails(p: p, showPhotos: false, onReport: report, onBlock: block))),
        ]),
      );
    }
    // Phones: card + buttons fit the screen, no scrolling; details open with «Подробнее» or a tap on the photo.
    Future<void> openProfile() => _openProfile(p);
    return LayoutBuilder(builder: (context, c) {
      final reserved = 130 + (_showSwipeHint ? 76 : 0) + (!_showSwipeHint && _showNudge ? 110 : 0);
      final cardMaxHeight = (c.maxHeight - reserved).clamp(260.0, 2000.0);
      return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), children: [
        FocusColumn(
          padding: EdgeInsets.zero,
          child: Column(children: [
            if (_showSwipeHint) _swipeHint(context),
            if (!_showSwipeHint && _showNudge) _refineNudge(context),
            Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: cardMaxHeight * 0.8),
                child: SwipeCard(
                  key: ValueKey(p['id']),
                  onLike: () => _act(p, 'like'),
                  onPass: () => _act(p, 'pass'),
                  child: SoulCard(p: p, onTap: openProfile),
                ),
              ),
            ),
            const SizedBox(height: 16),
            LikePassBar(onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'), onInfo: openProfile, onMessage: () => _writeFirst(p)),
          ]),
        ),
      ]);
    });
  }

  /// Feed: everyone left today, one under another, each with its own pass/like.
  Widget _adInStack(BuildContext context) {
    final ad = _ads[(_acted.length ~/ _adEvery - 1) % _ads.length];
    void done() => setState(() => _adsShownAt.add(_acted.length));
    return LayoutBuilder(builder: (context, c) {
      final cardMaxHeight = (c.maxHeight - 40).clamp(260.0, 2000.0);
      return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: cardMaxHeight * 0.8),
            child: SwipeCard(key: ValueKey('ad-${_acted.length}'), onLike: () async => done(), onPass: () async => done(), child: _adCard(ad, onClose: done)),
          ),
        ),
      ]);
    });
  }

  Widget _feed(BuildContext context, List<Map<String, dynamic>> people) {
    final columns = sizeClassOf(context) == SizeClass.expanded ? 3 : sizeClassOf(context) == SizeClass.medium ? 2 : 1;
    // People with an ad after every N of them (none for Gold/VIP).
    final entries = <Object>[];
    for (var i = 0; i < people.length; i++) {
      entries.add(people[i]);
      if (_ads.isNotEmpty && (i + 1) % _adEvery == 0) entries.add(_ads[((i + 1) ~/ _adEvery - 1) % _ads.length]);
    }
    Widget item(Map<String, dynamic> p) => Column(mainAxisSize: MainAxisSize.min, children: [
          SoulCard(p: p, onTap: () => _openProfile(p)),
          const SizedBox(height: 10),
          LikePassBar(onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'), onInfo: () => _openProfile(p)),
          const SizedBox(height: 28),
        ]);
    Widget entry(Object e) => e is Map<String, dynamic> && e.containsKey('sponsor')
        ? Padding(padding: const EdgeInsets.only(bottom: 28), child: _adCard(e, onClose: () => setState(() => _ads = _ads.where((a) => a['id'] != e['id']).toList())))
        : item(e as Map<String, dynamic>);
    if (columns == 1) {
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        itemCount: entries.length,
        itemBuilder: (_, i) => FocusColumn(padding: EdgeInsets.zero, child: KeyedSubtree(key: ValueKey((entries[i] as Map)['id']), child: entry(entries[i]))),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(24),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: columns, crossAxisSpacing: 24, childAspectRatio: 0.62),
      itemCount: entries.length,
      itemBuilder: (_, i) => KeyedSubtree(key: ValueKey((entries[i] as Map)['id']), child: entry(entries[i])),
    );
  }
}
