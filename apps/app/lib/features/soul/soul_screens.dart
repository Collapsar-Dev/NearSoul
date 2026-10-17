import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/soul_widgets.dart';
import '../onboarding/quick_scan_screen.dart';
import '../onboarding/reveal_screen.dart';
import '../shell.dart';
import 'soul_talk_screens.dart';
import '../me/paywall.dart';

/// S27/S28 Soul tab: who you are.
class SoulScreen extends ConsumerStatefulWidget {
  const SoulScreen({super.key});

  @override
  ConsumerState<SoulScreen> createState() => _SoulScreenState();
}

class _SoulScreenState extends ConsumerState<SoulScreen> {
  late Future<List<dynamic>> _f = _fetch();

  Future<List<dynamic>> _fetch() async {
    final api = ref.read(apiProvider);
    return Future.wait([api.get<Map<String, dynamic>>('/v1/reports/self'), api.get<dynamic>('/v1/me/card'), api.get<Map<String, dynamic>>('/v1/engine/progress')]);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: NsTitle(l.soulTitle)),
      body: AsyncBody<List<dynamic>>(
        future: _f,
        onRetry: () => setState(() => _f = _fetch()),
        builder: (context, data) {
          final r = data[0] as Map<String, dynamic>;
          final card = data[1] is Map<String, dynamic> ? data[1] as Map<String, dynamic> : null;
          final domains = (r['domains'] as List).cast<Map<String, dynamic>>();
          final depth = (r['depth'] as num?)?.toInt() ?? 40;
          final wide = sizeClassOf(context) == SizeClass.expanded;
          final header = Column(children: [
            Center(child: Constellation(domains: domains, size: wide ? 280 : 220)),
            ArchetypeHeader(archetype: (r['archetype'] as Map).cast<String, dynamic>()),
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              SizedBox(width: 40, height: 40, child: CircularProgressIndicator(value: depth / 100, strokeWidth: 5, backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest)),
              const SizedBox(width: 12),
              Text(l.profileDepth(depth), style: Theme.of(context).textTheme.titleMedium),
            ]),
            const SizedBox(height: 16),
            Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [for (final s in (r['strengths'] as List).cast<String>()) Chip(avatar: const Icon(Icons.star_rounded, size: 18), label: Text(s))]),
            if (((data[2] as Map)['refineRemaining'] as int? ?? 0) > 0) ...[
              Card(
                margin: const EdgeInsets.only(top: 12),
                child: ListTile(
                  leading: const Icon(Icons.tune),
                  title: Text(l.refineTitle),
                  subtitle: Text(l.refineBody((data[2] as Map)['refineRemaining'] as int)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    final done = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const QuickScanScreen(refine: true)));
                    if (done == true && context.mounted) showSnack(context, l.refineDone);
                    setState(() => _f = _fetch());
                  },
                ),
              ),
            ],
          ]);
          final body = Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            for (final d in domains) DomainRow(domain: d),
            SectionTitle(l.values),
            Wrap(spacing: 8, runSpacing: 8, children: [for (final v in (r['values'] as List).cast<String>()) Chip(label: Text(v))]),
            SectionTitle(l.relationshipStyle),
            for (final s in (r['relationshipStyle'] as List).cast<String>()) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('• $s')),
            if (card != null) ...[SectionTitle(l.cardTitle), PersonalityCardView(card: card)],
            const SizedBox(height: 16),
            FilledButton.icon(onPressed: () => context.push('/soul/report'), icon: const Icon(Icons.menu_book_outlined), label: Text(l.selfReport)),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              icon: const Icon(Icons.refresh),
              label: Text(l.retakeScan),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(content: Text(l.retakeConfirm), actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.cancel)),
                    FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.continueBtn)),
                  ]),
                );
                if (ok != true || !context.mounted) return;
                await ref.read(apiProvider).post('/v1/me/soul-profile/retake');
                if (!context.mounted) return;
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const QuickScanScreen(retake: true)));
                setState(() => _f = _fetch());
              },
            ),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                leading: const Icon(Icons.forum_outlined),
                title: Text(l.soulTalk),
                subtitle: Text(l.soulTalkIntroTitle),
                trailing: ref.watch(sessionProvider).me?.json['soulTalkEnabled'] == true ? const Icon(Icons.chevron_right) : Chip(label: Text(l.comingSoon)),
                onTap: ref.watch(sessionProvider).me?.json['soulTalkEnabled'] == true
                    ? () async {
                        await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SoulTalkScreen()));
                        setState(() => _f = _fetch());
                      }
                    : null,
              ),
            ),
            const SizedBox(height: 8),
            _DeepCard(
              progress: (data.length > 2 ? (data[2] as Map<String, dynamic>)['deepParts'] as List : const []).cast<Map<String, dynamic>>(),
              onOpen: (part) async {
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => QuickScanScreen(questionnaire: 'deep_$part')));
                setState(() => _f = _fetch());
              },
            ),
            const SizedBox(height: 32),
          ]);
          if (wide) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(width: 380, child: SingleChildScrollView(child: header)),
                const SizedBox(width: 32),
                Expanded(child: SingleChildScrollView(child: body)),
              ]),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _f = _fetch()),
            child: FocusColumn(maxWidth: 680, child: ListView(children: [header, const SizedBox(height: 16), body])),
          );
        },
      ),
    );
  }
}

/// S30 full self report.
class SelfReportScreen extends ConsumerStatefulWidget {
  const SelfReportScreen({super.key});

  @override
  ConsumerState<SelfReportScreen> createState() => _SelfReportScreenState();
}

class _SelfReportScreenState extends ConsumerState<SelfReportScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/reports/self');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.selfReport)),
      body: AsyncBody<Map<String, dynamic>>(
        future: _f,
        onRetry: () => setState(() => _f = ref.read(apiProvider).get('/v1/reports/self')),
        builder: (context, r) {
          List<String> list(String k) => ((r[k] as List?) ?? []).cast<String>();
          final full = r['full'] == true;
          return FocusColumn(
            maxWidth: 720,
            child: ListView(children: [
              if (r['freeDuringBeta'] == true) Align(alignment: Alignment.centerRight, child: Chip(label: Text(l.freeBeta))),
              ArchetypeHeader(archetype: (r['archetype'] as Map).cast<String, dynamic>()),
              const SizedBox(height: 24),
              for (final d in (r['domains'] as List).cast<Map<String, dynamic>>()) DomainRow(domain: d, showDating: true),
              SectionTitle(l.relationshipStyle),
              for (final s in list('relationshipStyle')) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('• $s')),
              if (full) ...[
                SectionTitle(l.needs),
                for (final s in list('needs')) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('• $s')),
                if (list('growthEdges').isNotEmpty) ...[SectionTitle(l.growth), for (final s in list('growthEdges')) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('• $s'))],
                SectionTitle(l.reflect),
                for (final s in list('reflect')) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text('? $s')),
              ] else
                for (final s in ((r['locked'] as List?) ?? []).cast<Map<String, dynamic>>())
                  ListTile(leading: const Icon(Icons.lock_outline), title: Text('${s['key']} · ${s['count']}'), subtitle: Text(l.locked), onTap: () async {
                    await showPaywall(context);
                    setState(() => _f = ref.read(apiProvider).get('/v1/reports/self'));
                  }),
              const SizedBox(height: 32),
            ]),
          );
        },
      ),
    );
  }
}

/// Deep Personality parts with progress (ENG-003).
class _DeepCard extends StatelessWidget {
  const _DeepCard({required this.progress, required this.onOpen});
  final List<Map<String, dynamic>> progress;
  final Future<void> Function(int part) onOpen;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final done = progress.where((p) => p['answered'] == p['total']).length;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [const Icon(Icons.psychology_outlined), const SizedBox(width: 8), Text(l.deepPersonality, style: Theme.of(context).textTheme.titleMedium)]),
          const SizedBox(height: 6),
          Text(done == 4 ? l.deepAllDone : l.deepIntro, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          for (final p in progress)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(value: (p['answered'] as int) / (p['total'] as int), strokeWidth: 4, backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest),
              ),
              title: Text(l.deepPart(p['part'] as int)),
              subtitle: Text('${p['answered']}/${p['total']}'),
              trailing: p['answered'] == p['total'] ? const Icon(Icons.check_circle, color: Colors.green) : const Icon(Icons.chevron_right),
              onTap: p['answered'] == p['total'] ? null : () => onOpen(p['part'] as int),
            ),
        ]),
      ),
    );
  }
}
