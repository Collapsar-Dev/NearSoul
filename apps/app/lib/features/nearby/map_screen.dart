import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../core/api.dart';
import '../../core/config.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// CR-29: matches who chose "Show me" appear on a map as an approximate area (never an address).
/// Strangers are never on the map. Your own spot is sent only while this screen is open.
class MatchMapScreen extends ConsumerStatefulWidget {
  const MatchMapScreen({super.key});

  @override
  ConsumerState<MatchMapScreen> createState() => _MatchMapScreenState();
}

class _MatchMapScreenState extends ConsumerState<MatchMapScreen> {
  static const _fallback = LatLng(52.3731, 4.8926); // launch city centre until we know where you are
  final _map = MapController();
  Map<String, dynamic>? _data;
  Object? _error;
  bool _noLocation = false;
  bool _centred = false;
  Timer? _timer;

  Api get _api => ref.read(apiProvider);

  @override
  void initState() {
    super.initState();
    _start();
    _timer = Timer.periodic(const Duration(minutes: 5), (_) => _refresh(sendLocation: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    await _refresh();
    if (!mounted) return;
    final me = _data?['me'] as Map?;
    // A tester's simulated spot is kept; otherwise refresh from the device.
    if (me == null || me['simulated'] != true) await _refresh(sendLocation: true);
  }

  Future<void> _refresh({bool sendLocation = false}) async {
    if (sendLocation) await _sendLocation();
    try {
      final d = await _api.get<Map<String, dynamic>>('/v1/map');
      if (!mounted) return;
      setState(() {
        _data = d;
        _error = null;
      });
      final me = d['me'] as Map?;
      if (!_centred && me != null) {
        _centred = true;
        _map.move(LatLng((me['lat'] as num).toDouble(), (me['lng'] as num).toDouble()), 14);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _sendLocation() async {
    if ((_data?['me'] as Map?)?['simulated'] == true) return;
    try {
      if (!kIsWeb && !await Geolocator.isLocationServiceEnabled()) throw Exception('off');
      var p = await Geolocator.checkPermission();
      if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
      if (p == LocationPermission.denied || p == LocationPermission.deniedForever) throw Exception('denied');
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 20)));
      await _api.post('/v1/location', {'lat': pos.latitude, 'lng': pos.longitude, 'accuracyM': pos.accuracy});
      if (mounted) setState(() => _noLocation = false);
    } catch (_) {
      if (mounted) setState(() => _noLocation = _data?['me'] == null);
    }
  }

  Future<void> _toggleShare(bool on) async {
    if (!on) {
      final d = await _api.post<Map<String, dynamic>>('/v1/map/stop');
      setState(() => _data = d);
      return;
    }
    final minutes = await showModalBottomSheet<int>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        final l = ctx.l;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(l.mapShowMe, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 8),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.lock_outline, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(l.mapPrivacy)),
              ]),
              const SizedBox(height: 16),
              FilledButton(onPressed: () => Navigator.pop(ctx, 60), child: Text(l.map1h)),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () => Navigator.pop(ctx, 240), child: Text(l.map4h)),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () => Navigator.pop(ctx, 0), child: Text(l.mapUntilOff)),
            ]),
          ),
        );
      },
    );
    if (minutes == null) return;
    try {
      final d = await _api.post<Map<String, dynamic>>('/v1/map/share', {'durationMin': minutes == 0 ? null : minutes});
      setState(() => _data = d);
      await _refresh(sendLocation: true);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  String _distance(BuildContext context, int? m) {
    if (m == null) return '';
    final l = context.l;
    if (m < 1000) return l.mapMeters(m);
    final km = (m / 1000).toStringAsFixed(1).replaceAll('.', Localizations.localeOf(context).languageCode == 'ru' ? ',' : '.');
    return l.mapKm(km);
  }

  String _ago(BuildContext context, String? iso) {
    final t = DateTime.tryParse(iso ?? '')?.toLocal();
    if (t == null) return '';
    final min = DateTime.now().difference(t).inMinutes.clamp(0, 100000);
    return min < 60 ? context.l.mapUpdatedMin(min) : context.l.mapUpdatedH(min ~/ 60);
  }

  void _showFriend(Map<String, dynamic> f) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: _Avatar(url: f['photo'] as String?, size: 52),
              title: Text(f['firstName'] as String, style: Theme.of(ctx).textTheme.titleLarge),
              subtitle: Text([_distance(ctx, f['approxM'] as int?), _ago(ctx, f['updatedAt'] as String?)].where((s) => s.isNotEmpty).join(' · ')),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.chat_bubble_outline),
                label: Text(ctx.l.mapWrite),
                onPressed: () {
                  Navigator.pop(ctx);
                  context.go('/matches/${f['matchId']}');
                },
              ),
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    final me = _data?['me'] as Map?;
    final friends = ((_data?['friends'] as List?) ?? const []).cast<Map<String, dynamic>>();
    final sharing = _data?['sharing'] as Map?;
    final until = DateTime.tryParse(sharing?['until'] as String? ?? '')?.toLocal();
    final isTester = ref.watch(sessionProvider).me?.isTester == true;
    final mePoint = me == null ? null : LatLng((me['lat'] as num).toDouble(), (me['lng'] as num).toDouble());

    return Scaffold(
      appBar: AppBar(title: Text(l.mapTitle), actions: [
        if (isTester) IconButton(tooltip: l.mapPickPlace, icon: const Icon(Icons.science_outlined), onPressed: () => context.push('/me/alpha').then((_) => _refresh())),
      ]),
      body: _error != null && _data == null
          ? ErrorState(error: _error!, onRetry: _refresh)
          : Stack(children: [
              FlutterMap(
                mapController: _map,
                options: MapOptions(initialCenter: mePoint ?? _fallback, initialZoom: 13, minZoom: 3, maxZoom: 16),
                children: [
                  // OpenStreetMap tiles through our own server (cached, no key, people's IPs stay with us).
                  TileLayer(urlTemplate: '${AppConfig.apiUrl}/v1/tiles/{z}/{x}/{y}.png', maxNativeZoom: 17, userAgentPackageName: 'app.nearsoul'),
                  // Each match is drawn as an area, which is all the server knows to share.
                  CircleLayer(circles: [
                    for (final f in friends)
                      CircleMarker(
                        point: LatLng((f['lat'] as num).toDouble(), (f['lng'] as num).toDouble()),
                        radius: 350,
                        useRadiusInMeter: true,
                        color: scheme.primary.withValues(alpha: 0.12),
                        borderColor: scheme.primary.withValues(alpha: 0.4),
                        borderStrokeWidth: 1.5,
                      ),
                  ]),
                  MarkerLayer(markers: [
                    if (mePoint != null)
                      Marker(
                        point: mePoint,
                        width: 22,
                        height: 22,
                        child: Semantics(
                          label: l.mapYou,
                          child: Container(decoration: BoxDecoration(color: Colors.blue, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3), boxShadow: const [BoxShadow(blurRadius: 6, color: Colors.black26)])),
                        ),
                      ),
                    for (final f in friends)
                      Marker(
                        point: LatLng((f['lat'] as num).toDouble(), (f['lng'] as num).toDouble()),
                        width: 120,
                        height: 92,
                        child: _FriendPin(name: f['firstName'] as String, photo: f['photo'] as String?, distance: _distance(context, f['approxM'] as int?), onTap: () => _showFriend(f)),
                      ),
                  ]),
                  const SimpleAttributionWidget(source: Text('OpenStreetMap contributors')),
                ],
              ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 28,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Card(
                      elevation: 3,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          SwitchListTile(
                            value: sharing != null,
                            onChanged: _data == null ? null : _toggleShare,
                            secondary: Icon(sharing != null ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                            title: Text(l.mapShowMe),
                            subtitle: Text(sharing == null ? l.mapGhost : until == null ? l.mapSharingForever : l.mapSharingUntil(TimeOfDay.fromDateTime(until).format(context))),
                          ),
                          if (_noLocation)
                            ListTile(
                              leading: const Icon(Icons.location_off_outlined),
                              title: Text(l.mapNoLocation),
                              trailing: TextButton(onPressed: () => _refresh(sendLocation: true), child: Text(l.mapAllow)),
                            ),
                          if (_data != null && friends.isEmpty)
                            Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 12), child: Text(l.mapEmpty, style: Theme.of(context).textTheme.bodySmall))
                          else if (friends.isNotEmpty)
                            SizedBox(
                              height: 44,
                              child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.fromLTRB(12, 0, 12, 8), children: [
                                for (final f in friends)
                                  Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ActionChip(
                                      avatar: _Avatar(url: f['photo'] as String?, size: 24),
                                      label: Text('${f['firstName']} · ${_distance(context, f['approxM'] as int?)}'),
                                      onPressed: () {
                                        _map.move(LatLng((f['lat'] as num).toDouble(), (f['lng'] as num).toDouble()), 15);
                                        _showFriend(f);
                                      },
                                    ),
                                  ),
                              ]),
                            ),
                        ]),
                      ),
                    ),
                  ),
                ),
              ),
              if (_data == null) const Center(child: CircularProgressIndicator()),
            ]),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.url, required this.size});
  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    final fallback = Container(width: size, height: size, color: Theme.of(context).colorScheme.secondaryContainer, child: Icon(Icons.person, size: size * 0.6));
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: url == null ? fallback : Image.network(url!, fit: BoxFit.cover, errorBuilder: (_, _, _) => fallback),
      ),
    );
  }
}

class _FriendPin extends StatelessWidget {
  const _FriendPin({required this.name, required this.photo, required this.distance, required this.onTap});
  final String name;
  final String? photo;
  final String distance;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: '$name, $distance',
      child: GestureDetector(
        onTap: onTap,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: const [BoxShadow(blurRadius: 6, color: Colors.black26)]),
            child: _Avatar(url: photo, size: 50),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: scheme.surface, borderRadius: BorderRadius.circular(12), boxShadow: const [BoxShadow(blurRadius: 4, color: Colors.black12)]),
            child: Text('$name · $distance', maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.labelMedium),
          ),
        ]),
      ),
    );
  }
}
