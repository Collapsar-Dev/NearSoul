import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// Opens the subscription levels (PAY-003, CR-18). Completes when the screen closes, so callers can refresh.
Future<void> showPaywall(BuildContext context) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SubscriptionScreen()));

String tierName(BuildContext context, String tier) {
  final l = context.l;
  return switch (tier) { 'plus' => l.tierPlus, 'gold' => l.tierGold, 'vip' => l.tierVip, _ => l.tierFree };
}

/// Free / Soul+ / Gold / VIP side by side. In the test version any level switches on for free.
class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  late Future<Map<String, dynamic>> _f = _load();

  Future<Map<String, dynamic>> _load() => ref.read(apiProvider).get<Map<String, dynamic>>('/v1/billing/status');

  Future<void> _activate(String tier) async {
    try {
      await ref.read(apiProvider).post('/v1/billing/test-activate', {'tier': tier});
      setState(() => _f = _load());
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  List<String> _features(BuildContext context, String tier, Map<String, dynamic> f) {
    final l = context.l;
    final daily = f['dailySetSize'] as int?;
    return [
      daily == null ? l.featDailyUnlimited : l.featDaily(daily),
      // Likes per day equal the daily set size for every level.
      daily == null ? l.featLikeUnlimited : l.featLikeLimit(daily),
      if (f['fullReports'] == true) l.featReports,
      f['seeLikes'] == true ? l.featLikes : l.featLikesCount,
      if (f['rewind'] == true) l.featRewind,
      if (f['seePersonaCount'] == true) l.featPersonas,
      if (f['showAds'] == false) l.featNoAds,
      if (f['messageFirst'] == true) l.featMessageFirst,
    ];
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(l.subscription)),
      body: FocusColumn(
        child: AsyncBody<Map<String, dynamic>>(
          future: _f,
          onRetry: () => setState(() => _f = _load()),
          builder: (context, s) {
            final current = s['tier'] as String;
            final test = s['testPurchases'] == true;
            final tiers = (s['tiers'] as List).cast<Map<String, dynamic>>();
            return ListView(children: [
              const SizedBox(height: 8),
              if (test)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: scheme.tertiaryContainer, borderRadius: BorderRadius.circular(12)),
                  child: Text(l.testModeNote, style: TextStyle(color: scheme.onTertiaryContainer)),
                ),
              const SizedBox(height: 12),
              for (final t in tiers)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: t['tier'] == current ? scheme.primary : scheme.outlineVariant, width: t['tier'] == current ? 2 : 1),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(tierName(context, t['tier'] as String), style: Theme.of(context).textTheme.titleLarge)),
                        if (t['tier'] == current) Chip(label: Text(l.tierCurrent)) else if (t['price'] != null) Text(l.perMonth(t['price'] as String)),
                      ]),
                      const SizedBox(height: 8),
                      for (final f in _features(context, t['tier'] as String, (t['features'] as Map).cast<String, dynamic>()))
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Icon(Icons.check, size: 18, color: scheme.primary),
                            const SizedBox(width: 8),
                            Expanded(child: Text(f)),
                          ]),
                        ),
                      if (t['tier'] != current) ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: test
                              ? BusyButton(label: t['tier'] == 'free' ? l.backToFree : l.activateTest, outlined: t['tier'] == 'free', onPressed: () => _activate(t['tier'] as String))
                              : (t['tier'] == 'free' ? const SizedBox.shrink() : OutlinedButton(onPressed: null, child: Text(l.storeSoon))),
                        ),
                      ],
                    ]),
                  ),
                ),
              Text(l.paywallRenewal, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 24),
            ]);
          },
        ),
      ),
    );
  }
}
