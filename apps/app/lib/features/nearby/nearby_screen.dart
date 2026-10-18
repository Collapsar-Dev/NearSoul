import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api.dart';
import '../../core/realtime.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../shell.dart';
import '../today/profile_widgets.dart';

/// S19–S22 Nearby Now (GEO-002..007). Location is sent only while this screen is open and the window is active.
class NearbyScreen extends ConsumerStatefulWidget {
  const NearbyScreen({super.key});

  @override
  ConsumerState<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends ConsumerState<NearbyScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _status;
  List<Map<String, dynamic>> _items = [];
  Object? _error;
  String? _locationProblem;
  Timer? _locTimer;
  Timer? _clock;
  StreamSubscription<RealtimeEvent>? _sub;

  Api get _api => ref.read(apiProvider);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _clock = Timer.periodic(const Duration(seconds: 30), (_) => mounted ? setState(() {}) : null);
    _sub = ref.read(realtimeProvider).events.listen((e) {
      if (e.name == 'notification.new' && e.data['type'] == 'nearby_alert') _load();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _locTimer?.cancel();
    _clock?.cancel();
    _sub?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _status?['open'] == true) _sendLocation();
  }

  Future<void> _load() async {
    try {
      final s = await _api.get<Map<String, dynamic>>('/v1/nearby/status');
      final list = await _api.get<Map<String, dynamic>>('/v1/nearby/list');
      setState(() {
        _status = s;
        _items = (list['items'] as List).cast<Map<String, dynamic>>();
        _error = null;
      });
      _scheduleLocation();
    } catch (e) {
      setState(() => _error = e);
    }
  }

  void _scheduleLocation() {
    _locTimer?.cancel();
    if (_status?['open'] != true) return;
    final simulated = (_status?['location'] as Map?)?['simulated'] == true;
    if (simulated) return; // tester simulator in use: don't overwrite with GPS
    _sendLocation();
    _locTimer = Timer.periodic(const Duration(minutes: 5), (_) => _sendLocation());
  }

  Future<bool> _ensurePermission() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool('ns_loc_explained') != true && mounted) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.lock_outline),
          title: Text(ctx.l.locationTitle),
          content: Text(ctx.l.locationBody),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(ctx.l.notNow)), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(ctx.l.allowLocation))],
        ),
      );
      if (ok != true) return false;
      await prefs.setBool('ns_loc_explained', true);
    }
    try {
      if (!kIsWeb && !await Geolocator.isLocationServiceEnabled()) {
        setState(() => _locationProblem = 'off');
        return false;
      }
      var p = await Geolocator.checkPermission();
      if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
      if (p == LocationPermission.denied || p == LocationPermission.deniedForever) {
        setState(() => _locationProblem = 'denied');
        return false;
      }
    } catch (_) {
      setState(() => _locationProblem = 'unavailable');
      return false;
    }
    return true;
  }

  Future<void> _sendLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 20)));
      await _api.post('/v1/location', {'lat': pos.latitude, 'lng': pos.longitude, 'accuracyM': pos.accuracy});
      if (mounted) setState(() => _locationProblem = null);
    } on ApiError catch (e) {
      if (mounted) setState(() => _locationProblem = e.code == 'LOCATION_INACCURATE' ? 'inaccurate' : null);
    } catch (_) {
      if (mounted) setState(() => _locationProblem = 'unavailable');
    }
  }

  Future<void> _open() async {
    final cfg = await showModalBottomSheet<Map<String, dynamic>>(context: context, isScrollControlled: true, showDragHandle: true, builder: (_) => const _OpenSheet());
    if (cfg == null) return;
    final me = ref.read(sessionProvider).me;
    final canSimulate = me?.isTester == true;
    final granted = await _ensurePermission();
    if (!granted && !canSimulate) return;
    await _api.post('/v1/nearby/open', cfg);
    await _load();
  }

  Future<void> _act(Map<String, dynamic> item, String action) async {
    final p = (item['profile'] as Map).cast<String, dynamic>();
    if (action == 'later') {
      await _api.post('/v1/nearby/later', {'userId': p['id']});
    } else {
      final r = await _api.post<Map<String, dynamic>>('/v1/likes', {'targetId': p['id'], 'action': action, 'source': 'nearby'});
      final match = r['match'] as Map<String, dynamic>?;
      if (match != null && mounted) await showMatchDialog(context, person: p, matchId: match['id'] as String, nearby: true);
    }
    await _load();
  }

  String _left() {
    final until = DateTime.tryParse(_status?['openUntil'] as String? ?? '')?.toLocal();
    if (until == null) return '';
    final d = until.difference(DateTime.now());
    if (d.isNegative) return '0:00';
    return '${d.inHours}:${(d.inMinutes % 60).toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final open = _status?['open'] == true;
    final me = ref.watch(sessionProvider).me;
    return Scaffold(
      appBar: AppBar(title: NsTitle(l.tabNearby), actions: [
        IconButton(tooltip: l.mapOpen, icon: const Icon(Icons.map_outlined), onPressed: () => context.push('/nearby/map')),
        if (me?.isTester == true) IconButton(tooltip: l.simulateLocation, icon: const Icon(Icons.science_outlined), onPressed: () => context.push('/me/alpha').then((_) => _load())),
      ]),
      body: _error != null
          ? ErrorState(error: _error!, onRetry: _load)
          : _status == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(16), children: [
                    FocusColumn(
                      maxWidth: 720,
                      padding: EdgeInsets.zero,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        // CR-29: the matches map sits at the top of Nearby.
                        Card(
                          child: ListTile(
                            leading: const Icon(Icons.map_outlined),
                            title: Text(l.mapOpen),
                            subtitle: Text(l.mapShowMe),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push('/nearby/map'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (!open) _offCard(context) else _onCard(context),
                        if (_locationProblem != null) ...[
                          const SizedBox(height: 12),
                          Card(
                            color: Theme.of(context).colorScheme.errorContainer,
                            child: ListTile(leading: const Icon(Icons.location_off_outlined), title: Text(_locationProblem == 'unavailable' ? l.locationDesktop : l.locationDenied)),
                          ),
                        ],
                        if ((_status!['location'] as Map?)?['simulated'] == true) ...[const SizedBox(height: 12), Chip(avatar: const Icon(Icons.science, size: 18), label: Text(l.simulated))],
                        if (_items.isNotEmpty) ...[
                          SectionTitle(l.nearbyList),
                          for (final item in _items) _nearbyCard(context, item, open),
                        ],
                      ]),
                    ),
                  ]),
                ),
    );
  }

  Widget _offCard(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [scheme.primary.withValues(alpha: 0.35), scheme.primary.withValues(alpha: 0.05)])),
            child: Icon(Icons.radar, size: 56, color: scheme.primary),
          ),
          const SizedBox(height: 16),
          Text(l.nearbyOffTitle, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(l.nearbyOffBody, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(l.nearbySafety, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: BusyButton(label: l.openToMeetCta, icon: Icons.radar, onPressed: _open)),
        ]),
      ),
    );
  }

  Widget _onCard(BuildContext context) {
    final l = context.l;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          Row(children: [
            const _Pulse(),
            const SizedBox(width: 12),
            Expanded(child: Text(l.openLeft(_left()), style: Theme.of(context).textTheme.titleMedium)),
            BusyButton(label: l.stop, outlined: true, onPressed: () async {
              await _api.post('/v1/nearby/close');
              await _load();
            }),
          ]),
          const SizedBox(height: 12),
          if (_items.isEmpty) Text(l.nearbyWaiting, textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  Widget _nearbyCard(BuildContext context, Map<String, dynamic> item, bool windowOpen) {
    final p = (item['profile'] as Map).cast<String, dynamic>();
    final acted = item['action'] != null || item['matched'] == true;
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(children: [
        SoulCard(p: p, onTap: () => context.push('/today/profile/${p['id']}')),
        const SizedBox(height: 12),
        if (!acted)
          LikePassBar(
            onLike: () => _act(item, 'like'),
            onPass: () => _act(item, 'pass'),
            onLater: windowOpen && item['later'] != true ? () => _act(item, 'later') : null,
          ),
      ]),
    );
  }
}

class _Pulse extends StatefulWidget {
  const _Pulse();

  @override
  State<_Pulse> createState() => _PulseState();
}

class _PulseState extends State<_Pulse> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    if (MediaQuery.disableAnimationsOf(context)) return Icon(Icons.radar, color: color);
    return AnimatedBuilder(
      animation: _c,
      builder: (_, _) => Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.15 + 0.25 * (1 - _c.value))),
        child: Icon(Icons.radar, color: color),
      ),
    );
  }
}

class _OpenSheet extends StatefulWidget {
  const _OpenSheet();

  @override
  State<_OpenSheet> createState() => _OpenSheetState();
}

class _OpenSheetState extends State<_OpenSheet> {
  int _duration = 120;
  int _radius = 1000;
  String? _activity;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final radii = [(500, '500 m'), (1000, '1 km'), (3000, '3 km'), (10000, '10 km')];
    final acts = [('coffee', l.actCoffee), ('walk', l.actWalk), ('drinks', l.actDrinks), ('chat', l.actChat)];
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(l.duration, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [for (final h in [1, 2, 4]) ChoiceChip(label: Text(l.hours(h)), selected: _duration == h * 60, onSelected: (_) => setState(() => _duration = h * 60))]),
          const SizedBox(height: 16),
          Text(l.radius, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [for (final r in radii) ChoiceChip(label: Text(r.$2), selected: _radius == r.$1, onSelected: (_) => setState(() => _radius = r.$1))]),
          const SizedBox(height: 16),
          Text(l.activity, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final a in acts) ChoiceChip(label: Text(a.$2), selected: _activity == a.$1, onSelected: (s) => setState(() => _activity = s ? a.$1 : null)),
          ]),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(onPressed: () => Navigator.pop(context, {'durationMin': _duration, 'radiusM': _radius, 'activity': _activity}), child: Text(l.start)),
          ),
        ]),
      ),
    );
  }
}
