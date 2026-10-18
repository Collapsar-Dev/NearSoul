import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// "They wrote to you first" (CR-26): read the message, look at the profile, then reply (opens the chat) or decline.
class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen> {
  late Future<List<dynamic>> _f = _load();

  Future<List<dynamic>> _load() => ref.read(apiProvider).get<List<dynamic>>('/v1/requests');

  Future<void> _accept(String id) async {
    final m = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/requests/$id/accept');
    if (mounted) context.go('/matches/${m['id']}');
  }

  Future<void> _decline(String id) async {
    await ref.read(apiProvider).post('/v1/requests/$id/decline');
    setState(() => _f = _load());
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.requestsTitle)),
      body: FocusColumn(
        child: AsyncBody<List<dynamic>>(
          future: _f,
          onRetry: () => setState(() => _f = _load()),
          builder: (context, data) {
            final items = data.cast<Map<String, dynamic>>();
            if (items.isEmpty) return EmptyState(icon: Icons.mark_email_read_outlined, text: l.requestsCount(0));
            return ListView(padding: const EdgeInsets.symmetric(vertical: 12), children: [
              for (final r in items)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      InkWell(
                        onTap: () => context.push('/today/profile/${r['fromId']}'),
                        child: Row(children: [
                          CircleAvatar(child: Text(((r['firstName'] as String?)?.isNotEmpty == true ? r['firstName'] as String : '?').characters.first.toUpperCase())),
                          const SizedBox(width: 12),
                          Expanded(child: Text(r['firstName'] as String? ?? '', style: Theme.of(context).textTheme.titleMedium)),
                          const Icon(Icons.chevron_right),
                        ]),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(14)),
                        child: Text(r['body'] as String),
                      ),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(child: BusyButton(label: l.decline, outlined: true, onPressed: () => _decline(r['id'] as String))),
                        const SizedBox(width: 12),
                        Expanded(child: BusyButton(label: l.reply, onPressed: () => _accept(r['id'] as String))),
                      ]),
                    ]),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }
}
