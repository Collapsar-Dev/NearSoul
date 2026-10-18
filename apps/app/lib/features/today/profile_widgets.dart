import 'package:flutter/material.dart';
import '../me/paywall.dart';
import '../../core/session.dart';
import '../../core/api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/common.dart';
import '../onboarding/reveal_screen.dart';

/// Photo carousel with page dots.
class PhotoCarousel extends StatefulWidget {
  const PhotoCarousel({super.key, required this.photos, this.aspect = 4 / 5, this.overlay, this.tapToFlip = false, this.onCenterTap});
  final List<Map<String, dynamic>> photos;
  final double aspect;
  final Widget? overlay;
  /// Stories-style: tap the left/right third to change photo (horizontal swipes are left to the card).
  final bool tapToFlip;
  final VoidCallback? onCenterTap;

  @override
  State<PhotoCarousel> createState() => _PhotoCarouselState();
}

class _PhotoCarouselState extends State<PhotoCarousel> {
  int _i = 0;
  final _page = PageController();

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  void _tap(TapUpDetails d, double width) {
    final x = d.localPosition.dx / width;
    final n = widget.photos.length;
    if (x < 0.33 && _i > 0) {
      _page.jumpToPage(_i - 1);
    } else if (x > 0.67 && _i < n - 1) {
      _page.jumpToPage(_i + 1);
    } else {
      widget.onCenterTap?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = widget.photos;
    return AspectRatio(
      aspectRatio: widget.aspect,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(fit: StackFit.expand, children: [
          if (photos.isEmpty) Container(color: Theme.of(context).colorScheme.surfaceContainerHighest)
          else
            PageView.builder(
              controller: _page,
              physics: widget.tapToFlip ? const NeverScrollableScrollPhysics() : null,
              itemCount: photos.length,
              onPageChanged: (i) => setState(() => _i = i),
              itemBuilder: (_, i) => Image.network(photos[i]['url'] as String, fit: BoxFit.cover, errorBuilder: (_, _, _) => Container(color: Colors.black12)),
            ),
          if (photos.length > 1)
            Positioned(
              top: 10,
              left: 12,
              right: 12,
              child: Row(children: [
                for (var i = 0; i < photos.length; i++)
                  Expanded(child: Container(height: 3, margin: const EdgeInsets.symmetric(horizontal: 2), decoration: BoxDecoration(color: Colors.white.withValues(alpha: i == _i ? 0.95 : 0.45), borderRadius: BorderRadius.circular(3)))),
              ]),
            ),
          if (widget.overlay != null) widget.overlay!,
          if (widget.tapToFlip) LayoutBuilder(builder: (context, c) => GestureDetector(behavior: HitTestBehavior.translucent, onTapUp: (d) => _tap(d, c.maxWidth))),
          if (!widget.tapToFlip && photos.isNotEmpty)
            Positioned.fill(child: GestureDetector(behavior: HitTestBehavior.translucent, onTap: () => showPhotoViewer(context, photos, _i))),
        ]),
      ),
    );
  }
}

/// Large card for Today's Souls (S14): photo, name, age, place, tier, archetype, top reason.
class SoulCard extends StatelessWidget {
  const SoulCard({super.key, required this.p, this.onTap});
  final Map<String, dynamic> p;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final compat = p['compatibility'] as Map<String, dynamic>?;
    final reasons = (compat?['reasons'] as List?)?.cast<String>() ?? const [];
    final place = (p['distanceBand'] ?? p['city']) as String?;
    return Semantics(
      button: onTap != null,
      onTap: onTap,
      child: PhotoCarousel(
        tapToFlip: true,
        onCenterTap: onTap,
        photos: (p['photos'] as List).cast<Map<String, dynamic>>(),
        overlay: Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            padding: const EdgeInsets.fromLTRB(18, 48, 18, 18),
            decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black87])),
            child: DefaultTextStyle(
              style: const TextStyle(color: Colors.white),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(child: Text('${p['firstName']}, ${p['age']}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white), overflow: TextOverflow.ellipsis)),
                  if (p['isDemo'] == true) ...[const SizedBox(width: 8), const DemoBadge()],
                ]),
                if (place != null) Text(place, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  if (compat?['percent'] is int) MatchPercentPill(percent: compat!['percent'] as int, onDark: true) else if (compat != null) TierChip(compat['tier'] as String, onDark: true),
                  Text((p['archetype'] as Map)['name'] as String, style: const TextStyle(color: Colors.white, fontStyle: FontStyle.italic)),
                  if (p['activity'] != null) Chip(label: Text(p['activity'] as String), visualDensity: VisualDensity.compact),
                ]),
                // Two reasons only: enough to spark interest, the rest is for the conversation.
                if (reasons.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  for (final r in reasons.take(2))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('•  ', style: TextStyle(color: Colors.white)),
                        Expanded(child: Text(r, maxLines: 2, overflow: TextOverflow.ellipsis)),
                      ]),
                    ),
                ],
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// Full public profile body (S15), reused by Today (wide), profile screen and Nearby.
class ProfileDetails extends StatelessWidget {
  const ProfileDetails({super.key, required this.p, this.showPhotos = true, this.onReport, this.onBlock});
  final Map<String, dynamic> p;
  final bool showPhotos;
  final VoidCallback? onReport;
  final VoidCallback? onBlock;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final compat = p['compatibility'] as Map<String, dynamic>?;
    final archetype = (p['archetype'] as Map).cast<String, dynamic>();
    final interests = (p['interests'] as List).cast<Map<String, dynamic>>();
    final scheme = Theme.of(context).colorScheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (showPhotos) PhotoCarousel(photos: (p['photos'] as List).cast<Map<String, dynamic>>()),
      const SizedBox(height: 16),
      Row(children: [
        Expanded(child: Text('${p['firstName']}, ${p['age']}', style: Theme.of(context).textTheme.headlineSmall)),
        if (p['isDemo'] == true) const DemoBadge(),
        if (onReport != null || onBlock != null)
          PopupMenuButton<String>(
            onSelected: (v) => v == 'report' ? onReport?.call() : onBlock?.call(),
            itemBuilder: (_) => [
              if (onBlock != null) PopupMenuItem(value: 'block', child: Text(l.block)),
              if (onReport != null) PopupMenuItem(value: 'report', child: Text(l.report)),
            ],
          ),
      ]),
      Text([p['distanceBand'] ?? p['city'], p['jobTitle']].whereType<String>().join(' · '), style: Theme.of(context).textTheme.bodyMedium),
      // VIP only (CR-18): how many profiles this person has. The server sends it only to VIP viewers.
      if (p['personaCount'] is int)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Chip(avatar: const Icon(Icons.workspace_premium_outlined, size: 18), label: Text(l.personaCountVip(p['personaCount'] as int))),
        ),
      const SizedBox(height: 12),
      if (compat != null)
        Card(
          color: scheme.secondary.withValues(alpha: 0.07),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                if (compat['percent'] is int) MatchPercentPill(percent: compat['percent'] as int) else TierChip(compat['tier'] as String),
                const Spacer(),
                Flexible(child: Text(archetype['name'] as String, style: TextStyle(color: scheme.secondary, fontStyle: FontStyle.italic), overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 12),
              Text(l.whyClick, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 6),
              for (final r in (compat['reasons'] as List).cast<String>())
                Padding(padding: const EdgeInsets.only(bottom: 6), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.check_circle, size: 18, color: scheme.secondary), const SizedBox(width: 8), Expanded(child: Text(r))])),
              if (((compat['moreReasons'] as int?) ?? 0) > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(l.moreReasons(compat['moreReasons'] as int), style: Theme.of(context).textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic)),
                ),
              if (compat['difference'] != null) ...[
                const SizedBox(height: 6),
                Text(l.oneDifference, style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(compat['difference'] as String),
              ],
            ]),
          ),
        ),
      if ((p['bio'] as String?)?.isNotEmpty == true) ...[SectionTitle(l.aboutPerson), Text(p['bio'] as String)],
      if (p['card'] != null) ...[const SizedBox(height: 16), PersonalityCardView(card: (p['card'] as Map).cast<String, dynamic>(), own: false)],
      SectionTitle(l.interests),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final i in interests)
          Chip(
            label: Text(i['label'] as String),
            avatar: i['shared'] == true ? Icon(Icons.favorite, size: 16, color: scheme.primary) : null,
            backgroundColor: i['shared'] == true ? scheme.primary.withValues(alpha: 0.1) : null,
          ),
      ]),
      const SizedBox(height: 8),
      Text(archetype['line'] as String, style: Theme.of(context).textTheme.bodySmall),
    ]);
  }
}

/// Like / pass buttons.
class LikePassBar extends StatelessWidget {
  const LikePassBar({super.key, required this.onLike, required this.onPass, this.onLater, this.onInfo, this.onMessage});
  final Future<void> Function() onLike;
  final Future<void> Function() onPass;
  final Future<void> Function()? onLater;
  /// Opens the full profile (photos and details) without scrolling the card screen.
  final Future<void> Function()? onInfo;
  /// VIP "write first" (CR-26); others are taken to the subscription screen.
  final Future<void> Function()? onMessage;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      _Round(icon: Icons.close_rounded, label: l.pass, onTap: onPass, color: Theme.of(context).colorScheme.outline),
      if (onLater != null) ...[const SizedBox(width: 20), _Round(icon: Icons.schedule_rounded, label: l.later, onTap: onLater!, color: Colors.amber.shade700)],
      if (onInfo != null) ...[const SizedBox(width: 20), _Round(icon: Icons.info_outline_rounded, label: l.moreInfo, onTap: onInfo!, color: Theme.of(context).colorScheme.secondary)],
      if (onMessage != null) ...[const SizedBox(width: 20), _Round(icon: Icons.mail_outline_rounded, label: l.writeFirst, onTap: onMessage!, color: Theme.of(context).colorScheme.tertiary)],
      const SizedBox(width: 20),
      _Round(icon: Icons.favorite_rounded, label: l.like, onTap: onLike, color: Theme.of(context).colorScheme.primary, big: true),
    ]);
  }
}

class _Round extends StatefulWidget {
  const _Round({required this.icon, required this.label, required this.onTap, required this.color, this.big = false});
  final IconData icon;
  final String label;
  final Future<void> Function() onTap;
  final Color color;
  final bool big;

  @override
  State<_Round> createState() => _RoundState();
}

class _RoundState extends State<_Round> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final size = widget.big ? 72.0 : 60.0;
    return Semantics(
      button: true,
      label: widget.label,
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        shape: CircleBorder(side: BorderSide(color: widget.color.withValues(alpha: 0.4), width: 2)),
        elevation: 2,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: _busy
              ? null
              : () async {
                  setState(() => _busy = true);
                  try {
                    await widget.onTap();
                  } catch (e) {
                    if (context.mounted) showSnack(context, errorText(context, e));
                  } finally {
                    if (mounted) setState(() => _busy = false);
                  }
                },
          child: SizedBox(width: size, height: size, child: Icon(widget.icon, color: widget.color, size: size * 0.45)),
        ),
      ),
    );
  }
}

/// S23 match moment.
Future<void> showMatchDialog(BuildContext context, {required Map<String, dynamic> person, required String matchId, required bool nearby}) {
  final l = context.l;
  return showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.favorite, size: 56, color: Theme.of(ctx).colorScheme.primary),
          const SizedBox(height: 12),
          Text(l.itsMatch, style: Theme.of(ctx).textTheme.headlineMedium),
          if (nearby) ...[const SizedBox(height: 8), Text(l.bothNearby, textAlign: TextAlign.center)],
          const SizedBox(height: 16),
          if ((person['photos'] as List).isNotEmpty)
            CircleAvatar(radius: 48, backgroundImage: NetworkImage(((person['photos'] as List).first as Map)['url'] as String)),
          const SizedBox(height: 8),
          Text(person['firstName'] as String, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/matches/$matchId');
              },
              child: Text(l.sayHi),
            ),
          ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l.keepExploring)),
        ]),
      ),
    ),
  );
}

/// Tinder-style swipe on a Today card: drag right to like, left to pass. Buttons below stay for keyboard,
/// screen readers and anyone who prefers tapping.
class SwipeCard extends StatefulWidget {
  const SwipeCard({super.key, required this.child, required this.onLike, required this.onPass});
  final Widget child;
  final Future<void> Function() onLike;
  final Future<void> Function() onPass;

  @override
  State<SwipeCard> createState() => _SwipeCardState();
}

class _SwipeCardState extends State<SwipeCard> with SingleTickerProviderStateMixin {
  late final AnimationController _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 220));
  Offset _drag = Offset.zero;
  Offset _from = Offset.zero;
  Offset _to = Offset.zero;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _anim.addListener(() => setState(() => _drag = Offset.lerp(_from, _to, Curves.easeOut.transform(_anim.value))!));
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  Future<void> _animateTo(Offset target) async {
    _from = _drag;
    _to = target;
    await _anim.forward(from: 0);
  }

  Future<void> _end(DragEndDetails d, double width) async {
    if (_busy) return;
    final vx = d.velocity.pixelsPerSecond.dx;
    final like = _drag.dx > width * 0.28 || vx > 900;
    final pass = _drag.dx < -width * 0.28 || vx < -900;
    if (!like && !pass) {
      await _animateTo(Offset.zero);
      return;
    }
    _busy = true;
    if (!MediaQuery.disableAnimationsOf(context)) await _animateTo(Offset((like ? 1.5 : -1.5) * width, _drag.dy));
    try {
      await (like ? widget.onLike() : widget.onPass());
    } finally {
      if (mounted) {
        setState(() {
          _drag = Offset.zero;
          _busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return LayoutBuilder(builder: (context, c) {
      final w = c.maxWidth;
      final t = (_drag.dx / (w * 0.28)).clamp(-1.0, 1.0);
      Widget stamp(String text, Color color, double opacity, Alignment at, double angle) => Positioned.fill(
            child: IgnorePointer(
              child: Align(
                alignment: at,
                child: Opacity(
                  opacity: opacity,
                  child: Transform.rotate(
                    angle: angle,
                    child: Container(
                      margin: const EdgeInsets.all(24),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(border: Border.all(color: color, width: 4), borderRadius: BorderRadius.circular(10), color: Colors.black.withValues(alpha: 0.15)),
                      child: Text(text.toUpperCase(), style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    ),
                  ),
                ),
              ),
            ),
          );
      return GestureDetector(
        onHorizontalDragUpdate: _busy ? null : (d) => setState(() => _drag += Offset(d.delta.dx, d.delta.dy * 0.3)),
        onHorizontalDragEnd: (d) => _end(d, w),
        child: Transform.translate(
          offset: _drag,
          child: Transform.rotate(
            angle: MediaQuery.disableAnimationsOf(context) ? 0 : t * 0.12,
            child: Stack(children: [
              widget.child,
              stamp(l.like, scheme.primary, t > 0 ? t : 0, Alignment.topLeft, -0.3),
              stamp(l.pass, scheme.error, t < 0 ? -t : 0, Alignment.topRight, 0.3),
            ]),
          ),
        ),
      );
    });
  }
}

/// Full-screen photos: swipe between them, tap or ✕ to close.
Future<void> showPhotoViewer(BuildContext context, List<Map<String, dynamic>> photos, int start) {
  return showDialog(
    context: context,
    barrierColor: Colors.black,
    builder: (ctx) => Dialog.fullscreen(
      backgroundColor: Colors.black,
      child: Stack(children: [
        PageView.builder(
          controller: PageController(initialPage: start),
          itemCount: photos.length,
          itemBuilder: (_, i) => GestureDetector(
            onTap: () => Navigator.pop(ctx),
            child: InteractiveViewer(child: Center(child: Image.network(photos[i]['url'] as String, fit: BoxFit.contain))),
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: SafeArea(child: IconButton(tooltip: MaterialLocalizations.of(ctx).closeButtonTooltip, icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(ctx))),
        ),
      ]),
    ),
  );
}

/// "80% match" pill: the rounded compatibility percentage with a colour that follows the tier.
class MatchPercentPill extends StatelessWidget {
  const MatchPercentPill({super.key, required this.percent, this.onDark = false});
  final int percent;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final color = percent >= 75 ? NsColors.success : percent >= 55 ? Theme.of(context).colorScheme.primary : NsColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: onDark ? Colors.black.withValues(alpha: 0.35) : color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: onDark ? Colors.white54 : color.withValues(alpha: 0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.favorite_rounded, size: 14, color: onDark ? Colors.white : color),
        const SizedBox(width: 6),
        Text(context.l.matchPercent(percent), style: TextStyle(fontWeight: FontWeight.w700, color: onDark ? Colors.white : color)),
      ]),
    );
  }
}

/// Sponsored card (CR-25): clearly labelled, same size as a person card, closable. No tracking beyond counts.
class AdCardView extends StatelessWidget {
  const AdCardView({super.key, required this.ad, required this.onOpen, required this.onClose, this.aspect = 4 / 5});
  final Map<String, dynamic> ad;
  final VoidCallback onOpen;
  final VoidCallback onClose;
  final double aspect;

  Color _color() {
    final hex = (ad['color'] as String? ?? '#5B6B8C').replaceFirst('#', '');
    return Color(int.tryParse('FF$hex', radix: 16) ?? 0xFF5B6B8C);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final base = _color();
    return AspectRatio(
      aspectRatio: aspect,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [base, Color.lerp(base, Colors.black, 0.45)!])),
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(999)),
                child: Text(ad['isTest'] == true ? l.adTestLabel : l.adLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
              ),
              const Spacer(),
              IconButton(tooltip: l.adHide, icon: const Icon(Icons.close, color: Colors.white), onPressed: onClose),
            ]),
            const Spacer(),
            const Icon(Icons.local_offer_outlined, color: Colors.white70, size: 40),
            const SizedBox(height: 16),
            Text(ad['title'] as String, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(ad['body'] as String, style: const TextStyle(color: Colors.white70, fontSize: 15)),
            const SizedBox(height: 6),
            Text(ad['sponsor'] as String, style: const TextStyle(color: Colors.white54, fontSize: 12)),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: base),
              onPressed: onOpen,
              child: Text(ad['cta'] as String),
            ),
          ]),
        ),
      ),
    );
  }
}

/// VIP "write first" (CR-26): asks for the message and sends it; non-VIP users see the subscription levels.
/// Returns the match id when the other side accepted right away (alpha demo profiles), otherwise null.
Future<String?> writeFirstFlow(BuildContext context, WidgetRef ref, {required String userId, required String name}) async {
  final l = context.l;
  // Check the level first so nobody types a message only to hit a paywall.
  try {
    final status = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/billing/status');
    if ((status['features'] as Map?)?['messageFirst'] != true) {
      if (context.mounted) await showPaywall(context);
      return null;
    }
  } catch (_) {}
  if (!context.mounted) return null;
  final ctl = TextEditingController();
  final text = await showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(name.isEmpty ? l.writeFirstTitle : '${l.writeFirstTitle}: $name'),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        TextField(controller: ctl, autofocus: true, maxLength: 500, maxLines: 4, minLines: 2),
        Text(l.writeFirstHint, style: Theme.of(ctx).textTheme.bodySmall),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l.cancel)),
        FilledButton(onPressed: () => Navigator.pop(ctx, ctl.text.trim()), child: Text(l.send)),
      ],
    ),
  );
  if (text == null || text.isEmpty || !context.mounted) return null;
  try {
    final r = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/requests', {'targetId': userId, 'body': text});
    final match = r['match'] as Map<String, dynamic>?;
    if (context.mounted && match == null) showSnack(context, l.writeFirstSent);
    return match?['id'] as String?;
  } on ApiError catch (e) {
    if (!context.mounted) return null;
    if (e.code == 'UPGRADE_REQUIRED') {
      await showPaywall(context);
    } else {
      showSnack(context, errorText(context, e));
    }
    return null;
  }
}
