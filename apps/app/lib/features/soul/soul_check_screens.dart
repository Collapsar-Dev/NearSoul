import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/platform/share_stub.dart' if (dart.library.js_interop) '../../core/platform/share_web.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// Bright Gen Z gradient used for celebratory moments (compatibility result, story card, match).
const nsGlow = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFFF5E8E), Color(0xFFB04DFF), Color(0xFF5B6CFF)]);

/// Shares the person's compatibility link (share sheet, or copies it).
Future<void> shareSoulLink(BuildContext context, WidgetRef ref) => _shareLinkFlow(context, ref);

Future<void> _shareLinkFlow(BuildContext context, WidgetRef ref) async {
  final l = context.l;
  try {
    final link = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/soul-link');
    final r = await shareLink(l.checkShareText, link['url'] as String);
    if (!context.mounted) return;
    if (r == 'copied') showSnack(context, l.checkLinkCopied);
    if (r == 'failed') showSnack(context, link['url'] as String);
  } catch (e) {
    if (context.mounted) showSnack(context, errorText(context, e));
  }
}

/// Soul tab: share your link or a story card so friends (or a crush) can check compatibility with you.
class SoulLinkCard extends ConsumerWidget {
  const SoulLinkCard({super.key, required this.archetypeName, required this.archetypeLine, required this.strengths});
  final String archetypeName;
  final String archetypeLine;
  final List<String> strengths;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    return Container(
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(gradient: nsGlow, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.all(20),
      child: DefaultTextStyle(
        style: const TextStyle(color: Colors.white),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(l.checkCardTitle, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 6),
          Text(l.checkCardBody, style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 16),
          Wrap(spacing: 8, runSpacing: 8, children: [
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF7B3FE4), minimumSize: const Size(0, 44)),
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => SoulStoryScreen(archetypeName: archetypeName, archetypeLine: archetypeLine, strengths: strengths))),
              icon: const Icon(Icons.auto_awesome),
              label: Text(l.checkStory),
            ),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white70), minimumSize: const Size(0, 44)),
              onPressed: () => _shareLinkFlow(context, ref),
              icon: const Icon(Icons.link),
              label: Text(l.checkShareLink),
            ),
            TextButton.icon(
              style: TextButton.styleFrom(foregroundColor: Colors.white, minimumSize: const Size(0, 44)),
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SoulChecksScreen())),
              icon: const Icon(Icons.people_alt_outlined),
              label: Text(l.checkWho),
            ),
          ]),
        ]),
      ),
    );
  }
}

/// A 9:16 card for Instagram / TikTok stories: archetype, strengths and "how compatible are we?" + link.
class SoulStoryScreen extends ConsumerStatefulWidget {
  const SoulStoryScreen({super.key, required this.archetypeName, required this.archetypeLine, required this.strengths});
  final String archetypeName;
  final String archetypeLine;
  final List<String> strengths;

  @override
  ConsumerState<SoulStoryScreen> createState() => _SoulStoryScreenState();
}

class _SoulStoryScreenState extends ConsumerState<SoulStoryScreen> {
  final _key = GlobalKey();
  late final Future<Map<String, dynamic>> _link = ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/soul-link');
  bool _busy = false;

  Future<void> _share(String url) async {
    final l = context.l;
    setState(() => _busy = true);
    try {
      final boundary = _key.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 1080 / boundary.size.width);
      final png = await image.toByteData(format: ui.ImageByteFormat.png);
      final r = await shareImage(png!.buffer.asUint8List(), 'nearsoul-soul.png', '${l.checkShareText} $url');
      if (!mounted) return;
      if (r == 'downloaded') showSnack(context, l.checkSaved);
      if (r == 'failed') await shareLink(l.checkShareText, url);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.checkStory)),
      body: AsyncBody<Map<String, dynamic>>(
        future: _link,
        onRetry: () {},
        builder: (context, link) {
          final url = link['url'] as String;
          return LayoutBuilder(builder: (context, c) {
            final h = (c.maxHeight - 120).clamp(320.0, 900.0);
            return Column(children: [
              const SizedBox(height: 12),
              Center(
                child: SizedBox(
                  height: h,
                  width: h * 9 / 16,
                  child: RepaintBoundary(key: _key, child: _StoryCard(name: widget.archetypeName, line: widget.archetypeLine, strengths: widget.strengths, url: url)),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _busy ? null : () => _share(url),
                icon: _busy ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.ios_share),
                label: Text(l.checkShareStory),
              ),
            ]);
          });
        },
      ),
    );
  }
}

class _StoryCard extends StatelessWidget {
  const _StoryCard({required this.name, required this.line, required this.strengths, required this.url});
  final String name;
  final String line;
  final List<String> strengths;
  final String url;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return LayoutBuilder(builder: (context, c) {
      final k = c.maxWidth / 360; // design at 360 wide, scales to any size
      // Never break a word: shrink the title so its longest word fits on one line.
      final longest = name.split(RegExp(r'\s+')).fold<int>(1, (m, w) => math.max(m, w.length));
      final titleSize = math.min(44 * k, (c.maxWidth - 48 * k) / (longest * 0.6));
      return Container(
        decoration: BoxDecoration(gradient: nsGlow, borderRadius: BorderRadius.circular(24 * k)),
        padding: EdgeInsets.all(24 * k),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            SizedBox(width: 34 * k, height: 34 * k, child: const NsLogo()),
            SizedBox(width: 8 * k),
            Text('NearSoul', style: TextStyle(color: Colors.white, fontSize: 18 * k, fontWeight: FontWeight.w700)),
          ]),
          const Spacer(),
          Text(l.storyMySoul, style: TextStyle(color: Colors.white70, fontSize: 16 * k, letterSpacing: 1.2 * k)),
          SizedBox(height: 6 * k),
          Text(name, style: TextStyle(color: Colors.white, fontSize: titleSize, height: 1.05, fontWeight: FontWeight.w900)),
          SizedBox(height: 10 * k),
          Text(line, style: TextStyle(color: Colors.white, fontSize: 16 * k)),
          SizedBox(height: 18 * k),
          for (final s in strengths.take(3))
            Padding(
              padding: EdgeInsets.only(bottom: 8 * k),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 14 * k, vertical: 8 * k),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                child: Text('✦ $s', style: TextStyle(color: Colors.white, fontSize: 15 * k, fontWeight: FontWeight.w600)),
              ),
            ),
          const Spacer(),
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16 * k),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18 * k)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l.storyAsk, style: TextStyle(color: const Color(0xFF2B1B4D), fontSize: 20 * k, fontWeight: FontWeight.w800)),
              SizedBox(height: 4 * k),
              Text(url.replaceFirst(RegExp(r'^https?://'), ''), style: TextStyle(color: const Color(0xFF7B3FE4), fontSize: 14 * k, fontWeight: FontWeight.w600)),
            ]),
          ),
        ]),
      );
    });
  }
}

/// /c/{code}: someone shared their link. Check compatibility, then share your own.
class SoulCheckScreen extends ConsumerStatefulWidget {
  const SoulCheckScreen({super.key, required this.code});
  final String code;

  @override
  ConsumerState<SoulCheckScreen> createState() => _SoulCheckScreenState();
}

class _SoulCheckScreenState extends ConsumerState<SoulCheckScreen> {
  late Future<Map<String, dynamic>> _preview = ref.read(apiProvider).get<Map<String, dynamic>>('/v1/soul-links/${widget.code}');
  Map<String, dynamic>? _result;
  bool _busy = false;

  Future<void> _check() async {
    setState(() => _busy = true);
    try {
      final r = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/soul-links/${widget.code}/check');
      setState(() => _result = r);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _leave() => context.canPop() ? context.pop() : context.go(ref.read(sessionProvider).me?.isActive == true ? '/today' : '/welcome');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(leading: IconButton(icon: const Icon(Icons.close), onPressed: _leave, tooltip: l.close), title: Text(l.checkTitle)),
      body: FocusColumn(
        maxWidth: 560,
        child: AsyncBody<Map<String, dynamic>>(
          future: _preview,
          onRetry: () => setState(() => _preview = ref.read(apiProvider).get('/v1/soul-links/${widget.code}')),
          builder: (context, p) {
            if (p['isMe'] == true) {
              return ListView(padding: const EdgeInsets.symmetric(vertical: 24), children: [
                Text(l.checkOwnLink, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                FilledButton.icon(onPressed: () => _shareLinkFlow(context, ref), icon: const Icon(Icons.link), label: Text(l.checkShareLink)),
              ]);
            }
            final r = _result;
            if (r != null) return CompatibilityReveal(result: r, onShareMine: () => _shareLinkFlow(context, ref), onDone: _leave);
            return ListView(padding: const EdgeInsets.symmetric(vertical: 24), children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(gradient: nsGlow, shape: BoxShape.circle),
                  child: CircleAvatar(radius: 56, backgroundImage: p['photo'] != null ? NetworkImage(p['photo'] as String) : null, child: p['photo'] == null ? const Icon(Icons.person, size: 48) : null),
                ),
              ),
              const SizedBox(height: 16),
              Text(l.checkInvite(p['firstName'] as String), textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text((p['archetype'] as Map)['name'] as String, textAlign: TextAlign.center, style: archetypeStyleSmall(context)),
              const SizedBox(height: 24),
              Text(l.checkHow, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              _GlowButton(label: l.checkGo, busy: _busy, onTap: _check),
              const SizedBox(height: 12),
              Text(l.checkPrivacy, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ]);
          },
        ),
      ),
    );
  }
}

TextStyle? archetypeStyleSmall(BuildContext context) =>
    Theme.of(context).textTheme.titleLarge?.copyWith(fontFamily: 'serif', fontStyle: FontStyle.italic, color: Theme.of(context).colorScheme.secondary);

class _GlowButton extends StatelessWidget {
  const _GlowButton({required this.label, required this.onTap, this.busy = false, this.icon = Icons.auto_awesome});
  final String label;
  final VoidCallback onTap;
  final bool busy;
  final IconData icon;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(gradient: nsGlow, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: const Color(0xFFB04DFF).withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 6))]),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: busy ? null : onTap,
            child: SizedBox(
              height: 56,
              child: Center(
                child: busy
                    ? const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                    : Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(icon, color: Colors.white),
                        const SizedBox(width: 8),
                        Text(label, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
                      ]),
              ),
            ),
          ),
        ),
      );
}

/// Animated big percent + both archetypes + reasons. Used for link checks.
class CompatibilityReveal extends StatelessWidget {
  const CompatibilityReveal({super.key, required this.result, required this.onShareMine, required this.onDone});
  final Map<String, dynamic> result;
  final VoidCallback onShareMine;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final percent = result['percent'] as int;
    final them = (result['them'] as Map).cast<String, dynamic>();
    final you = (result['you'] as Map).cast<String, dynamic>();
    final reasons = (result['reasons'] as List).cast<String>();
    final more = result['moreReasons'] as int? ?? 0;
    return ListView(padding: const EdgeInsets.symmetric(vertical: 16), children: [
      Container(
        decoration: BoxDecoration(gradient: nsGlow, borderRadius: BorderRadius.circular(28)),
        padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
        child: Column(children: [
          Text(l.checkYouAnd(them['firstName'] as String), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: percent.toDouble()),
            duration: MediaQuery.of(context).disableAnimations ? Duration.zero : const Duration(milliseconds: 1400),
            curve: Curves.easeOutCubic,
            builder: (_, v, _) => Text('${v.round()}%', style: const TextStyle(color: Colors.white, fontSize: 84, height: 1, fontWeight: FontWeight.w900)),
          ),
          const SizedBox(height: 6),
          Text(l.checkVerdict(percent >= 75 ? 'high' : percent >= 55 ? 'good' : 'some'), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 18),
          Row(children: [
            Expanded(child: _ArchetypeChip(label: l.checkYou, name: you['archetype'] as String)),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('✦', style: TextStyle(color: Colors.white, fontSize: 22))),
            Expanded(child: _ArchetypeChip(label: them['firstName'] as String, name: them['archetype'] as String)),
          ]),
        ]),
      ),
      const SizedBox(height: 20),
      Text(l.checkWhy, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      for (final r in reasons)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('💫 ', style: TextStyle(fontSize: 18)),
            Expanded(child: Text(r, style: Theme.of(context).textTheme.bodyLarge)),
          ]),
        ),
      if (more > 0) Text(l.checkMore(more), style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 24),
      _GlowButton(label: l.checkShareMine, icon: Icons.ios_share, onTap: onShareMine),
      const SizedBox(height: 8),
      TextButton(onPressed: onDone, child: Text(l.done)),
    ]);
  }
}

class _ArchetypeChip extends StatelessWidget {
  const _ArchetypeChip({required this.label, required this.name});
  final String label;
  final String name;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(16)),
        child: Column(children: [
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 2),
          Text(name, maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        ]),
      );
}

/// Who checked compatibility with my link, and links I checked.
class SoulChecksScreen extends ConsumerWidget {
  const SoulChecksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.checkWho)),
      body: FocusColumn(
        maxWidth: 560,
        child: AsyncBody<Map<String, dynamic>>(
          future: ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/soul-checks'),
          onRetry: () {},
          builder: (context, d) {
            final items = (d['items'] as List).cast<Map<String, dynamic>>();
            if (items.isEmpty) {
              return ListView(padding: const EdgeInsets.symmetric(vertical: 32), children: [
                Text(l.checkNone, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton.icon(onPressed: () => _shareLinkFlow(context, ref), icon: const Icon(Icons.link), label: Text(l.checkShareLink)),
              ]);
            }
            return ListView(children: [
              for (final i in items)
                ListTile(
                  leading: CircleAvatar(backgroundImage: i['photo'] != null ? NetworkImage(i['photo'] as String) : null, child: i['photo'] == null ? const Icon(Icons.person) : null),
                  title: Text((i['firstName'] as String).isEmpty ? l.checkSomeone : i['firstName'] as String),
                  subtitle: Text(i['theyChecked'] == true ? l.checkTheyChecked : l.checkYouChecked),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(gradient: nsGlow, borderRadius: BorderRadius.circular(999)),
                    child: Text('${i['percent']}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }
}
