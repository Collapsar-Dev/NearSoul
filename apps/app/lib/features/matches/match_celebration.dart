import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../soul/soul_check_screens.dart' show nsGlow;
import 'chat_screen.dart' show pendingChatDrafts;

/// Full-screen "It's a match!" moment: both photos, the match percent, a mini "you two" report and conversation
/// starters. Tapping a starter opens the chat with it in the message box (the person still decides to send it).
class MatchCelebration extends ConsumerStatefulWidget {
  const MatchCelebration({super.key, required this.person, required this.matchId, required this.nearby});
  final Map<String, dynamic> person;
  final String matchId;
  final bool nearby;

  @override
  ConsumerState<MatchCelebration> createState() => _MatchCelebrationState();
}

class _MatchCelebrationState extends ConsumerState<MatchCelebration> with SingleTickerProviderStateMixin {
  late final AnimationController _pop = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
  Map<String, dynamic>? _report;
  String? _myPhoto;

  @override
  void initState() {
    super.initState();
    final api = ref.read(apiProvider);
    api.get<Map<String, dynamic>>('/v1/matches/${widget.matchId}/report').then((r) => mounted ? setState(() => _report = r) : null).catchError((_) => null);
    api.get<Map<String, dynamic>>('/v1/me/profile').then((p) {
      final photos = (p['photos'] as List?) ?? const [];
      if (mounted && photos.isNotEmpty) setState(() => _myPhoto = (photos.first as Map)['url'] as String);
    }).catchError((_) => null);
  }

  @override
  void dispose() {
    _pop.dispose();
    super.dispose();
  }

  void _openChat([String? draft]) {
    if (draft != null) pendingChatDrafts[widget.matchId] = draft;
    final router = GoRouter.of(context);
    Navigator.of(context).pop();
    router.go('/matches/${widget.matchId}');
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final p = widget.person;
    final photos = (p['photos'] as List?) ?? const [];
    final theirPhoto = photos.isNotEmpty ? (photos.first as Map)['url'] as String : null;
    final compat = p['compatibility'] as Map?;
    final percent = compat?['percent'] as int?;
    final r = _report;
    final reasons = ((r?['reasons'] as List?) ?? (compat?['reasons'] as List?) ?? const []).cast<String>().take(3).toList();
    final starters = ((r?['starters'] as List?) ?? const []).cast<String>().take(3).toList();
    final archetype = (r?['with'] as Map?)?['archetype'] as Map? ?? p['archetype'] as Map?;
    final reduce = MediaQuery.of(context).disableAnimations;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: nsGlow),
        child: SafeArea(
          child: Stack(children: [
            if (!reduce) Positioned.fill(child: IgnorePointer(child: _Sparkles(controller: _pop))),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: ListView(padding: const EdgeInsets.fromLTRB(20, 24, 20, 24), children: [
                  ScaleTransition(
                    scale: CurvedAnimation(parent: _pop, curve: reduce ? Curves.linear : Curves.elasticOut),
                    child: Text(l.itsMatch, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.w900, height: 1.1)),
                  ),
                  if (widget.nearby) Padding(padding: const EdgeInsets.only(top: 6), child: Text(l.bothNearby, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white))),
                  const SizedBox(height: 22),
                  SizedBox(
                    height: 132,
                    child: Stack(alignment: Alignment.center, children: [
                      Transform.translate(offset: const Offset(-46, 0), child: Transform.rotate(angle: -0.12, child: _Avatar(url: _myPhoto))),
                      Transform.translate(offset: const Offset(46, 0), child: Transform.rotate(angle: 0.12, child: _Avatar(url: theirPhoto))),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(blurRadius: 12, color: Colors.black26)]),
                        child: const Icon(Icons.favorite, color: Color(0xFFFF5E8E), size: 28),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 14),
                  Text(l.matchWith(p['firstName'] as String), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                  if (percent != null)
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                        child: Text(l.matchPercent(percent), style: const TextStyle(color: Color(0xFF7B3FE4), fontWeight: FontWeight.w900, fontSize: 18)),
                      ),
                    ),
                  const SizedBox(height: 22),
                  _Panel(
                    title: l.matchMiniReport,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (archetype != null) Text(l.matchTheirType(p['firstName'] as String, archetype['name'] as String), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      for (final x in reasons)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('✦  ', style: TextStyle(color: Colors.white)),
                            Expanded(child: Text(x, style: const TextStyle(color: Colors.white))),
                          ]),
                        ),
                      if (r == null) const LinearProgressIndicator(color: Colors.white, backgroundColor: Colors.white24),
                      TextButton(
                        style: TextButton.styleFrom(foregroundColor: Colors.white, padding: EdgeInsets.zero),
                        onPressed: () {
                          final router = GoRouter.of(context);
                          Navigator.of(context).pop();
                          router.go('/matches/${widget.matchId}/report');
                        },
                        child: Text('${l.youTwo} →'),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  _Panel(
                    title: l.matchHowToStart,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text(l.matchTapStarter, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      const SizedBox(height: 8),
                      for (final s in starters)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Material(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => _openChat(s),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(children: [
                                  const Text('💬  '),
                                  Expanded(child: Text(s, style: const TextStyle(color: Color(0xFF2B1B4D), fontWeight: FontWeight.w600))),
                                  const Icon(Icons.north_east, size: 18, color: Color(0xFF7B3FE4)),
                                ]),
                              ),
                            ),
                          ),
                        ),
                      if (r == null) const LinearProgressIndicator(color: Colors.white, backgroundColor: Colors.white24),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF7B3FE4), minimumSize: const Size.fromHeight(56)),
                    onPressed: () => _openChat(),
                    icon: const Icon(Icons.chat_bubble),
                    label: Text(l.sayHi, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 6),
                  TextButton(style: TextButton.styleFrom(foregroundColor: Colors.white), onPressed: () => Navigator.of(context).pop(), child: Text(l.keepExploring)),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.url});
  final String? url;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(4),
        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(blurRadius: 16, color: Colors.black26)]),
        child: CircleAvatar(radius: 56, backgroundColor: const Color(0xFFEDE4FF), backgroundImage: url != null ? NetworkImage(url!) : null, child: url == null ? const Icon(Icons.person, size: 48, color: Color(0xFF7B3FE4)) : null),
      );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white24)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          child,
        ]),
      );
}

/// Floating hearts and sparkles that burst once when the screen opens.
class _Sparkles extends StatelessWidget {
  const _Sparkles({required this.controller});
  final AnimationController controller;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: controller,
        builder: (context, _) => CustomPaint(painter: _SparklePainter(controller.value)),
      );
}

class _SparklePainter extends CustomPainter {
  _SparklePainter(this.t);
  final double t;
  static final _rnd = math.Random(7);
  static final _seeds = List.generate(26, (_) => (_rnd.nextDouble(), _rnd.nextDouble(), _rnd.nextDouble()));

  @override
  void paint(Canvas canvas, Size size) {
    for (final (i, s) in _seeds.indexed) {
      final x = s.$1 * size.width;
      final y = size.height * (0.15 + s.$2 * 0.7) - t * 80 * (0.5 + s.$3);
      final r = (2 + s.$3 * 4) * (1 - (t - 0.6).clamp(0, 1) * 0.6);
      final paint = Paint()..color = (i.isEven ? Colors.white : const Color(0xFFFFD1E0)).withValues(alpha: (0.9 - t * 0.5).clamp(0.2, 0.9));
      canvas.drawCircle(Offset(x, y), r, paint);
    }
  }

  @override
  bool shouldRepaint(_SparklePainter old) => old.t != t;
}
