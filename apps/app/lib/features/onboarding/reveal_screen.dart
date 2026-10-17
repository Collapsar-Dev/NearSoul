import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/soul_widgets.dart';
import 'onboarding_screens.dart';

/// S10–S11: Soul Profile reveal (aha #1) followed by the Personality DNA card review.
class RevealScreen extends ConsumerStatefulWidget {
  const RevealScreen({super.key});

  @override
  ConsumerState<RevealScreen> createState() => _RevealScreenState();
}

class _RevealScreenState extends ConsumerState<RevealScreen> {
  late Future<Map<String, dynamic>> _report = ref.read(apiProvider).get('/v1/reports/self');
  Map<String, dynamic>? _card;
  bool _cardStep = false;
  bool _generating = false;

  Future<void> _toCard() async {
    setState(() {
      _cardStep = true;
      _generating = true;
    });
    final api = ref.read(apiProvider);
    try {
      final existing = await api.get<dynamic>('/v1/me/card');
      _card = existing is Map<String, dynamic> && existing.isNotEmpty ? existing : await api.post<Map<String, dynamic>>('/v1/me/card/generate', {});
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
    if (mounted) setState(() => _generating = false);
  }

  Future<void> _finishCard(String visibility) async {
    final api = ref.read(apiProvider);
    await api.patch('/v1/me/card', {'reviewed': true});
    await api.patch('/v1/me', {'cardVisibility': visibility});
    await ref.read(sessionProvider.notifier).reloadMe();
  }

  Future<void> _edit() async {
    final c = _card!;
    final headline = TextEditingController(text: c['headline'] as String);
    final summary = TextEditingController(text: c['summary'] as String);
    final comm = TextEditingController(text: c['communicationStyle'] as String);
    final date = TextEditingController(text: c['idealFirstDate'] as String);
    final l = context.l;
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.cardEdit),
        content: SizedBox(
          width: 480,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: headline, maxLength: 60, decoration: InputDecoration(labelText: l.cardHeadline)),
              TextField(controller: summary, maxLength: 300, maxLines: 4, decoration: InputDecoration(labelText: l.cardSummary)),
              TextField(controller: comm, maxLength: 140, maxLines: 2, decoration: InputDecoration(labelText: l.cardComm)),
              TextField(controller: date, maxLength: 140, maxLines: 2, decoration: InputDecoration(labelText: l.cardDate)),
            ]),
          ),
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.cancel)), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.save))],
      ),
    );
    if (saved != true) return;
    try {
      final updated = await ref.read(apiProvider).patch<Map<String, dynamic>>('/v1/me/card', {
        'headline': headline.text.trim(),
        'summary': summary.text.trim(),
        'communication_style': comm.text.trim(),
        'ideal_first_date': date.text.trim(),
      });
      setState(() => _card = updated);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(actions: const [SkipStepButton(step: 'reveal'), TestBadge(), SizedBox(width: 12)]),
      body: SafeArea(
        child: _cardStep ? _cardView(context) : AsyncBody<Map<String, dynamic>>(
          future: _report,
          onRetry: () => setState(() => _report = ref.read(apiProvider).get('/v1/reports/self')),
          builder: (context, r) {
            final domains = (r['domains'] as List).cast<Map<String, dynamic>>();
            return FocusColumn(
              maxWidth: 640,
              child: ListView(children: [
                Text(l.revealTitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                Center(child: Constellation(domains: domains)),
                ArchetypeHeader(archetype: (r['archetype'] as Map).cast<String, dynamic>()),
                const SizedBox(height: 24),
                for (final d in domains) DomainRow(domain: d),
                SectionTitle(l.revealStrengths),
                Wrap(spacing: 8, runSpacing: 8, children: [for (final s in (r['strengths'] as List).cast<String>()) Chip(avatar: const Icon(Icons.star_rounded, size: 18), label: Text(s))]),
                const SizedBox(height: 24),
                AccuracyRating(
                  title: l.revealRate,
                  onSubmit: (stars, comment) => ref.read(apiProvider).post('/v1/ratings', {'kind': 'reveal_accuracy', 'stars': stars, 'comment': ?comment}),
                ),
                const SizedBox(height: 16),
                FilledButton(onPressed: _toCard, child: Text(l.continueBtn)),
                const SizedBox(height: 24),
              ]),
            );
          },
        ),
      ),
    );
  }

  Widget _cardView(BuildContext context) {
    final l = context.l;
    if (_generating || _card == null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [const CircularProgressIndicator(), const SizedBox(height: 16), Text(l.cardGenerating)]));
    }
    final c = _card!;
    return FocusColumn(
      child: ListView(children: [
        Text(l.cardTitle, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 16),
        PersonalityCardView(card: c),
        const SizedBox(height: 24),
        BusyButton(label: l.cardShow, onPressed: () => _finishCard('matches_only')),
        const SizedBox(height: 8),
        OutlinedButton(onPressed: _edit, child: Text(l.cardEdit)),
        const SizedBox(height: 8),
        TextButton(onPressed: () => _finishCard('hidden'), child: Text(l.cardHide)),
      ]),
    );
  }
}

class PersonalityCardView extends StatelessWidget {
  const PersonalityCardView({super.key, required this.card});
  final Map<String, dynamic> card;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    final ai = card['source'] == 'ai' || card['aiWritten'] == true;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [scheme.secondary.withValues(alpha: 0.12), scheme.primary.withValues(alpha: 0.12)]),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(card['headline'] as String, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(card['summary'] as String),
        const SizedBox(height: 12),
        Text(l.cardComm, style: Theme.of(context).textTheme.labelLarge),
        Text(card['communicationStyle'] as String),
        const SizedBox(height: 8),
        Text(l.cardDate, style: Theme.of(context).textTheme.labelLarge),
        Text(card['idealFirstDate'] as String),
        const SizedBox(height: 12),
        Wrap(spacing: 6, runSpacing: 6, children: [for (final s in (card['strengths'] as List).cast<String>()) Chip(label: Text(s), visualDensity: VisualDensity.compact)]),
        const SizedBox(height: 8),
        Text(ai ? l.cardAi : l.cardTemplate, style: Theme.of(context).textTheme.bodySmall),
      ]),
    );
  }
}
