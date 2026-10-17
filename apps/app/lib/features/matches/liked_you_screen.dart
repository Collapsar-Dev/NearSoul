import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../me/paywall.dart';
import '../today/profile_widgets.dart';

/// "Liked you" (CR-18): everyone sees the count; Gold and VIP see the people and can like back.
class LikedYouScreen extends ConsumerStatefulWidget {
  const LikedYouScreen({super.key});

  @override
  ConsumerState<LikedYouScreen> createState() => _LikedYouScreenState();
}

class _LikedYouScreenState extends ConsumerState<LikedYouScreen> {
  late Future<(Map<String, dynamic>, List<Map<String, dynamic>>)> _f = _load();

  Future<(Map<String, dynamic>, List<Map<String, dynamic>>)> _load() async {
    final api = ref.read(apiProvider);
    final r = await api.get<Map<String, dynamic>>('/v1/likes/received');
    final people = <Map<String, dynamic>>[];
    for (final id in (r['ids'] as List).cast<String>()) {
      try {
        people.add(await api.get<Map<String, dynamic>>('/v1/profiles/$id'));
      } catch (_) {}
    }
    return (r, people);
  }

  Future<void> _act(String id, String action) async {
    try {
      final res = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/likes', {'targetId': id, 'action': action, 'source': 'profile'});
      if (mounted && res['match'] != null) showSnack(context, context.l.itsMatch);
      setState(() => _f = _load());
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.likedYou)),
      body: AsyncBody<(Map<String, dynamic>, List<Map<String, dynamic>>)>(
        future: _f,
        onRetry: () => setState(() => _f = _load()),
        builder: (context, data) {
          final (r, people) = data;
          final count = r['count'] as int;
          if (r['canSee'] != true) {
            return FocusColumn(
              child: EmptyState(
                icon: Icons.favorite,
                text: '${l.likedYouCount(count)}\n${l.likedYouUpsell}',
                action: FilledButton(
                  onPressed: () async {
                    await showPaywall(context);
                    setState(() => _f = _load());
                  },
                  child: Text(l.seePlans),
                ),
              ),
            );
          }
          if (people.isEmpty) return EmptyState(icon: Icons.favorite_border, text: l.likedYouCount(0));
          return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 32), children: [
            for (final p in people)
              FocusColumn(
                padding: EdgeInsets.zero,
                child: Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(children: [
                      ProfileDetails(p: p),
                      const SizedBox(height: 8),
                      LikePassBar(onLike: () => _act(p['id'] as String, 'like'), onPass: () => _act(p['id'] as String, 'pass')),
                    ]),
                  ),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
