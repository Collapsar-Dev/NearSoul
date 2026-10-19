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
import '../soul/soul_check_screens.dart' show shareSoulLink;

/// S17 Today's Souls: a small curated daily set (ENG-014).
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  Map<String, dynamic>? _set;
  /// Cards loaded so far (the set is paged: up to a few hundred people a day).
  final List<Map<String, dynamic>> _cards = [];
  int _total = 0;
  int _actedBase = 0;
  final Set<String> _initiallyActed = {};
  bool _loadingMore = false;
  static const _page = 30;
  /// "Know yourself" break card after the first 10 people, then after every 50 (founder requests 2026-10-18/19).
  static const _breakEvery = 50;
  static bool _isBreakAt(int n) => n == 10 || (n > 0 && n % _breakEvery == 0);
  final Set<int> _breaksShownAt = {};
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
    final places = ((ad['locations'] as List?) ?? const []).cast<Map<String, dynamic>>();
    if (places.isEmpty) {
      await launchUrl(Uri.parse(ad['url'] as String), mode: LaunchMode.externalApplication);
      return;
    }
    // A partner with several venues: list them, each opens in the maps app.
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    await showModalBottomSheet<void>(
      isScrollControlled: true,
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 8), child: Text(ad['title'] as String, style: Theme.of(ctx).textTheme.titleLarge)),
          for (final pl in places)
            ListTile(
              leading: const Icon(Icons.place_outlined),
              title: Text(pl['name'] as String),
              subtitle: Text(pl['address'] as String),
              trailing: TextButton(onPressed: () => launchUrl(Uri.parse(pl['mapsUrl'] as String), mode: LaunchMode.externalApplication), child: Text(context.l.openInMaps)),
            ),
          const SizedBox(height: 12),
        ]),
      ),
    );
  }

  Widget _adCard(Map<String, dynamic> ad, {VoidCallback? onClose}) {
    _countAd(ad, 'impression');
    return AdCardView(ad: ad, onOpen: () => _openAd(ad), onClose: onClose ?? () {});
  }

  /// Card mode: after every N people decided today, one ad sits in the stack until closed or swiped away.
  bool get _adDue => _ads.isNotEmpty && _doneCount > 0 && _doneCount % _adEvery == 0 && !_isBreakAt(_doneCount) && !_adsShownAt.contains(_doneCount);

  /// Ads run in order (the café partner first) over the ad slots, skipping slots used by breaks.
  Map<String, dynamic> _adFor(int n) {
    var slots = 0;
    for (var k = _adEvery; k <= n; k += _adEvery) {
      if (!_isBreakAt(k)) slots++;
    }
    return _ads[(slots - 1).clamp(0, 1 << 30) % _ads.length];
  }

  /// Gentle "keep discovering yourself" nudge: after a few cards, at most once a day, while questions remain.
  int _refineRemaining = 0;
  int? _nextDeepPart;
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
      final parts = ((pr['deepParts'] as List?) ?? const []).cast<Map<String, dynamic>>();
      final next = parts.where((d) => (d['answered'] as int) < (d['total'] as int)).firstOrNull;
      if (mounted) {
        setState(() {
          _refineRemaining = (pr['refineRemaining'] as int?) ?? 0;
          _nextDeepPart = next?['part'] as int?;
        });
      }
    } catch (_) {}
  }

  bool get _showNudge => _refineRemaining > 0 && !_nudgeDismissedToday && _doneCount >= 3 && _doneCount < _breakEvery;

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
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
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
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
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
      final s = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/daily-set?offset=0&limit=$_page');
      final cards = (s['cards'] as List).cast<Map<String, dynamic>>();
      setState(() {
        _set = s;
        _total = (s['total'] as int?) ?? cards.length;
        _actedBase = (s['actedCount'] as int?) ?? 0;
        _cards
          ..clear()
          ..addAll(cards);
        _initiallyActed
          ..clear()
          ..addAll(cards.where((c) => c['action'] != null).map((c) => c['id'] as String));
        _acted
          ..clear()
          ..addAll(_initiallyActed);
      });
      await _maybeLoadMore();
    } catch (e) {
      setState(() => _error = e);
    }
  }

  List<Map<String, dynamic>> get _remaining => _cards.where((c) => !_acted.contains(c['id'])).toList();

  /// People decided today (likes + passes), including those not loaded yet.
  int get _doneCount => _actedBase + _acted.difference(_initiallyActed).length;
  int get _leftCount => (_total - _doneCount).clamp(0, 100000);

  /// Keeps a few undecided people loaded ahead (cards) / the whole list growing (feed).
  Future<void> _maybeLoadMore({bool force = false}) async {
    if (_loadingMore || _cards.length >= _total || (!force && _remaining.length >= 8)) return;
    _loadingMore = true;
    try {
      final s = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/daily-set?offset=${_cards.length}&limit=$_page');
      final more = (s['cards'] as List).cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        final known = _cards.map((c) => c['id']).toSet();
        for (final c in more) {
          if (known.contains(c['id'])) continue;
          _cards.add(c);
          if (c['action'] != null) {
            _initiallyActed.add(c['id'] as String);
            _acted.add(c['id'] as String);
          }
        }
        _total = (s['total'] as int?) ?? _total;
      });
    } catch (_) {
    } finally {
      _loadingMore = false;
    }
  }

  bool get _breakDue => _doneCount > 0 && _isBreakAt(_doneCount) && !_breaksShownAt.contains(_doneCount);

  Widget _breakCard(BuildContext context, {required VoidCallback onDone, int? seen}) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 4 / 5,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [scheme.secondaryContainer, scheme.tertiaryContainer]),
        ),
        child: Column(children: [
          const Spacer(),
          const NsLogo(size: 96),
          const SizedBox(height: 20),
          Text(l.breakTitle, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text(_refineRemaining > 0 ? l.breakBody(seen ?? _doneCount) : _nextDeepPart != null ? l.breakBodyDeep(_nextDeepPart!) : l.breakBodyCheck, textAlign: TextAlign.center),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () async {
                onDone();
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                if (_refineRemaining == 0 && _nextDeepPart == null) return shareSoulLink(context, ref);
                await Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => _refineRemaining > 0 ? const QuickScanScreen(refine: true) : QuickScanScreen(questionnaire: 'deep_$_nextDeepPart'),
                ));
                await _loadRefine();
              },
              child: Text(_refineRemaining == 0 && _nextDeepPart == null ? l.checkShareLink : l.breakGo),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: onDone, child: Text(l.breakSkip)),
        ]),
      ),
    );
  }

  Widget _breakInStack(BuildContext context) {
    void done() => setState(() => _breaksShownAt.add(_doneCount));
    return LayoutBuilder(builder: (context, c) {
      final cardMaxHeight = (c.maxHeight - 40).clamp(260.0, 2000.0);
      return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: cardMaxHeight * 0.8),
            child: SwipeCard(key: ValueKey('break-$_doneCount'), onLike: () async => done(), onPass: () async => done(), child: _breakCard(context, onDone: done)),
          ),
        ),
      ]);
    });
  }

  Future<void> _act(Map<String, dynamic> p, String action) async {
    try {
      final r = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/likes', {'targetId': p['id'], 'action': action, 'source': 'daily'});
      setState(() => _acted.add(p['id'] as String));
      _maybeLoadMore();
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
        // Short-lived so it never covers the like/pass buttons for long.
        duration: const Duration(seconds: 3),
        persist: false,
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
          if (_set != null) Center(child: Padding(padding: const EdgeInsets.only(right: 4), child: Text(l.todayLeft(_leftCount)))),
          IconButton(
            tooltip: _list ? l.viewCards : l.viewList,
            icon: Icon(_list ? Icons.style_outlined : Icons.view_agenda_outlined),
            onPressed: () => _setView(!_list),
          ),
          IconButton(tooltip: l.notifications, icon: const Icon(Icons.notifications_none), onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            context.push('/me/notifications');
          }),
        ],
      ),
      body: _error != null
          ? ErrorState(error: _error!, onRetry: _load)
          : _set == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(onRefresh: _load, child: remaining.isEmpty ? _empty(context) : _list ? _feed(context, remaining) : _breakDue ? _breakInStack(context) : _adDue ? _adInStack(context) : _content(context, remaining.first)),
    );
  }

  Widget _empty(BuildContext context) {
    final l = context.l;
    final total = _total;
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
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
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
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
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
    final actions = LikePassBar(onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'), onMessage: () => _writeFirst(p));
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
    final ad = _adFor(_doneCount);
    void done() => setState(() => _adsShownAt.add(_doneCount));
    return LayoutBuilder(builder: (context, c) {
      final cardMaxHeight = (c.maxHeight - 40).clamp(260.0, 2000.0);
      return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: cardMaxHeight * 0.8),
            child: SwipeCard(key: ValueKey('ad-$_doneCount'), onLike: () async => done(), onPass: () async => done(), child: _adCard(ad, onClose: done)),
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
      final n = i + 1;
      if (_isBreakAt(n) && !_breaksShownAt.contains(-n)) {
        entries.add({'break': n, 'id': 'break-$n'});
      } else if (_ads.isNotEmpty && n % _adEvery == 0 && !_isBreakAt(n)) {
        // The same ad can repeat further down: give each placement its own key.
        entries.add({..._adFor(n), 'key': 'ad-$n'});
      }
    }
    Widget item(Map<String, dynamic> p) => Column(mainAxisSize: MainAxisSize.min, children: [
          SoulCard(p: p, onTap: () => _openProfile(p)),
          const SizedBox(height: 10),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: LikePassBar(onLike: () => _act(p, 'like'), onPass: () => _act(p, 'pass'), onInfo: () => _openProfile(p), onMessage: () => _writeFirst(p)),
          ),
          const SizedBox(height: 28),
        ]);
    Widget entry(Object e) => e is Map<String, dynamic> && e.containsKey('break')
        ? Padding(padding: const EdgeInsets.only(bottom: 28), child: _breakCard(context, seen: e['break'] as int, onDone: () => setState(() => _breaksShownAt.add(-(e['break'] as int)))))
        : e is Map<String, dynamic> && e.containsKey('sponsor')
        ? Padding(padding: const EdgeInsets.only(bottom: 28), child: _adCard(e, onClose: () => setState(() => _ads = _ads.where((a) => a['id'] != e['id']).toList())))
        : item(e as Map<String, dynamic>);
    if (columns == 1) {
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        itemCount: entries.length,
        itemBuilder: (_, i) {
          if (i >= entries.length - 4) WidgetsBinding.instance.addPostFrameCallback((_) => _maybeLoadMore(force: true));
          return FocusColumn(padding: EdgeInsets.zero, child: KeyedSubtree(key: ValueKey((entries[i] as Map)['key'] ?? (entries[i] as Map)['id']), child: entry(entries[i])));
        },
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(24),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: columns, crossAxisSpacing: 24, childAspectRatio: 0.62),
      itemCount: entries.length,
      itemBuilder: (_, i) {
        if (i >= entries.length - 6) WidgetsBinding.instance.addPostFrameCallback((_) => _maybeLoadMore(force: true));
        return KeyedSubtree(key: ValueKey((entries[i] as Map)['key'] ?? (entries[i] as Map)['id']), child: entry(entries[i]));
      },
    );
  }
}
