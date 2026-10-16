import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/soul_widgets.dart';

/// S26 "You two" pair report. Locked sections come only as titles + counts from the server.
class PairReportScreen extends ConsumerStatefulWidget {
  const PairReportScreen({super.key, required this.matchId});
  final String matchId;

  @override
  ConsumerState<PairReportScreen> createState() => _PairReportScreenState();
}

class _PairReportScreenState extends ConsumerState<PairReportScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/matches/${widget.matchId}/report');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.youTwo)),
      body: AsyncBody<Map<String, dynamic>>(
        future: _f,
        onRetry: () => setState(() => _f = ref.read(apiProvider).get('/v1/matches/${widget.matchId}/report')),
        builder: (context, r) {
          final name = (r['with'] as Map)['firstName'] as String;
          List<String> list(String k) => ((r[k] as List?) ?? []).cast<String>();
          Widget bullets(List<String> items, IconData icon) => Column(children: [
                for (final t in items)
                  Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, size: 18), const SizedBox(width: 8), Expanded(child: Text(t))])),
              ]);
          final full = r['full'] == true;
          return FocusColumn(
            maxWidth: 720,
            child: ListView(children: [
              const SizedBox(height: 8),
              Row(children: [TierChip(r['tier'] as String), const Spacer(), if (r['freeDuringBeta'] == true) Chip(label: Text(l.freeBeta))]),
              const SizedBox(height: 12),
              if (list('cardLines').isNotEmpty) Text(list('cardLines').join(' — '), style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontStyle: FontStyle.italic)),
              SectionTitle(l.whyClick),
              bullets(full ? list('allReasons') : list('reasons'), Icons.check_circle_outline),
              SectionTitle(l.starters),
              bullets(list('starters'), Icons.chat_bubble_outline),
              if (full) ...[
                if (list('frictions').isNotEmpty) ...[SectionTitle(l.frictions), bullets(list('frictions'), Icons.balance)],
                if (list('tips').isNotEmpty) ...[SectionTitle(l.tips(name)), bullets(list('tips'), Icons.lightbulb_outline)],
                if (list('firstDateIdeas').isNotEmpty) ...[SectionTitle(l.firstDate), bullets(list('firstDateIdeas'), Icons.local_cafe_outlined)],
                if ((r['layers'] as Map?)?.isNotEmpty == true) ...[
                  SectionTitle(l.layers),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final e in (r['layers'] as Map).entries) Chip(label: Text('${e.key}: ${e.value ?? '–'}')),
                  ]),
                ],
              ] else
                for (final s in ((r['locked'] as List?) ?? []).cast<Map<String, dynamic>>())
                  ListTile(leading: const Icon(Icons.lock_outline), title: Text('${s['key']} · ${s['count']}'), subtitle: Text(l.locked)),
              const SizedBox(height: 16),
              AccuracyRating(
                title: l.pairAccuracy,
                onSubmit: (stars, comment) => ref.read(apiProvider).post('/v1/ratings', {'kind': 'pair_report_accuracy', 'stars': stars, 'matchId': widget.matchId, 'comment': ?comment}),
              ),
              const SizedBox(height: 24),
            ]),
          );
        },
      ),
    );
  }
}
