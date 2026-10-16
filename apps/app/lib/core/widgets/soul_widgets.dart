import 'dart:math';
import 'package:flutter/material.dart';
import '../theme.dart';
import 'common.dart';

/// Constellation of the five domains (PRD §5.6). Star size follows the score; animated reveal.
class Constellation extends StatelessWidget {
  const Constellation({super.key, required this.domains, this.size = 220});
  final List<Map<String, dynamic>> domains;
  final double size;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final reduce = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      label: domains.map((d) => '${d['name']}: ${d['band'] ?? '-'}').join(', '),
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: reduce ? 1 : 0, end: 1),
        duration: const Duration(milliseconds: 1400),
        curve: Curves.easeOutCubic,
        builder: (context, t, _) => CustomPaint(size: Size.square(size), painter: _ConstellationPainter(domains, t, scheme.secondary, scheme.primary)),
      ),
    );
  }
}

class _ConstellationPainter extends CustomPainter {
  _ConstellationPainter(this.domains, this.t, this.line, this.star);
  final List<Map<String, dynamic>> domains;
  final double t;
  final Color line;
  final Color star;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width * 0.38;
    final points = <Offset>[];
    for (var i = 0; i < domains.length; i++) {
      final a = -pi / 2 + i * 2 * pi / domains.length;
      final score = ((domains[i]['score'] as num?) ?? 50) / 100;
      points.add(c + Offset(cos(a), sin(a)) * r * (0.45 + 0.55 * score) * t);
    }
    final lp = Paint()
      ..color = line.withValues(alpha: 0.35 * t)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawPath(Path()..addPolygon(points, true), lp);
    for (final p in points) {
      canvas.drawLine(c, p, lp..color = line.withValues(alpha: 0.12 * t));
    }
    for (var i = 0; i < points.length; i++) {
      final score = ((domains[i]['score'] as num?) ?? 50) / 100;
      final radius = (5 + 9 * score) * t;
      canvas.drawCircle(points[i], radius * 2.2, Paint()..color = star.withValues(alpha: 0.12 * t));
      canvas.drawCircle(points[i], radius, Paint()..color = star.withValues(alpha: t));
    }
  }

  @override
  bool shouldRepaint(_ConstellationPainter old) => old.t != t || old.domains != domains;
}

/// One domain row: name, two positive poles, band position and the description.
class DomainRow extends StatelessWidget {
  const DomainRow({super.key, required this.domain, this.showDating = false});
  final Map<String, dynamic> domain;
  final bool showDating;

  @override
  Widget build(BuildContext context) {
    final band = domain['band'] as String?;
    final pos = switch (band) { 'low' => 0.15, 'balanced' => 0.5, 'high' => 0.85, _ => null };
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(domain['name'] as String, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Row(children: [
          Text(domain['low'] as String, style: Theme.of(context).textTheme.bodySmall),
          const Spacer(),
          Text(domain['high'] as String, style: Theme.of(context).textTheme.bodySmall),
        ]),
        const SizedBox(height: 4),
        LayoutBuilder(builder: (context, c) {
          return Stack(clipBehavior: Clip.none, children: [
            Container(height: 6, decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), gradient: LinearGradient(colors: [scheme.secondary.withValues(alpha: 0.25), scheme.primary.withValues(alpha: 0.35)]))),
            if (pos != null)
              Positioned(
                left: (c.maxWidth - 16) * pos,
                top: -5,
                child: Container(width: 16, height: 16, decoration: BoxDecoration(shape: BoxShape.circle, color: scheme.secondary, border: Border.all(color: Colors.white, width: 2))),
              ),
          ]);
        }),
        const SizedBox(height: 10),
        if (domain['summary'] != null) Text(domain['summary'] as String),
        if (showDating && domain['dating'] != null) ...[
          const SizedBox(height: 6),
          Text(domain['dating'] as String, style: TextStyle(color: scheme.secondary, fontStyle: FontStyle.italic)),
        ],
        if ((domain['confidence'] as num? ?? 1) < 0.75) ...[
          const SizedBox(height: 4),
          Text(context.l.lowConfidence, style: Theme.of(context).textTheme.bodySmall),
        ],
      ]),
    );
  }
}

class ArchetypeHeader extends StatelessWidget {
  const ArchetypeHeader({super.key, required this.archetype});
  final Map<String, dynamic> archetype;

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(archetype['name'] as String, style: archetypeStyle(context), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text(archetype['line'] as String, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
        if (archetype['disclaimer'] != null) ...[
          const SizedBox(height: 6),
          Text(archetype['disclaimer'] as String, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ]);
}

/// 1–5 stars with an optional comment (ALPHA-005).
class AccuracyRating extends StatefulWidget {
  const AccuracyRating({super.key, required this.title, required this.onSubmit});
  final String title;
  final Future<void> Function(int stars, String? comment) onSubmit;

  @override
  State<AccuracyRating> createState() => _AccuracyRatingState();
}

class _AccuracyRatingState extends State<AccuracyRating> {
  int _stars = 0;
  bool _sent = false;
  final _comment = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    if (_sent) return Padding(padding: const EdgeInsets.all(12), child: Text(l.revealRateThanks, textAlign: TextAlign.center));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            for (var i = 1; i <= 5; i++)
              IconButton(
                tooltip: '$i',
                icon: Icon(i <= _stars ? Icons.star_rounded : Icons.star_outline_rounded, size: 34, color: Colors.amber.shade700),
                onPressed: () => setState(() => _stars = i),
              ),
          ]),
          if (_stars > 0 && _stars < 4) TextField(controller: _comment, maxLength: 300, decoration: InputDecoration(labelText: l.revealOff)),
          if (_stars > 0)
            BusyButton(
              label: l.send,
              onPressed: () async {
                await widget.onSubmit(_stars, _comment.text.trim().isEmpty ? null : _comment.text.trim());
                if (mounted) setState(() => _sent = true);
              },
            ),
        ]),
      ),
    );
  }
}
