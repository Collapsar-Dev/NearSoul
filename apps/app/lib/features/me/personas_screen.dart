import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/config.dart';
import '../../core/responsive.dart';
import '../../core/router.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// CR-17: separate profiles under one sign-in. Switching rebuilds the router so no screen keeps the old profile's data.
class PersonasScreen extends ConsumerStatefulWidget {
  const PersonasScreen({super.key});

  @override
  ConsumerState<PersonasScreen> createState() => _PersonasScreenState();
}

class _PersonasScreenState extends ConsumerState<PersonasScreen> {
  late Future<Map<String, dynamic>> _f = _load();

  Future<Map<String, dynamic>> _load() => ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/personas');

  Future<void> _switch(String id) async {
    try {
      await ref.read(sessionProvider.notifier).switchPersona(id);
      ref.invalidate(routerProvider);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  Future<String?> _askLabel(String title, [String? initial]) {
    final ctl = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: TextField(controller: ctl, autofocus: true, maxLength: 30, decoration: InputDecoration(labelText: context.l.profileLabel)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(context.l.cancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctl.text.trim()), child: Text(context.l.save)),
        ],
      ),
    );
  }

  Future<void> _add() async {
    final label = await _askLabel(context.l.profileNew);
    if (label == null || label.isEmpty) return;
    try {
      final created = await ref.read(apiProvider).post<Map<String, dynamic>>('/v1/me/personas', {'label': label});
      await _switch(created['id'] as String);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  Future<void> _rename(String id, String? current) async {
    final label = await _askLabel(context.l.profileRename, current);
    if (label == null || label.isEmpty) return;
    try {
      await ref.read(apiProvider).patch('/v1/me/personas/$id', {'label': label});
      setState(() => _f = _load());
      await ref.read(sessionProvider.notifier).reloadMe();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.profiles), leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/me'))),
      body: FocusColumn(
        child: AsyncBody<Map<String, dynamic>>(
          future: _f,
          onRetry: () => setState(() => _f = _load()),
          builder: (context, data) {
            final items = (data['items'] as List).cast<Map<String, dynamic>>();
            final max = data['max'] as int;
            return ListView(children: [
              Padding(padding: const EdgeInsets.only(top: 12), child: Text(l.profilesHint)),
              Padding(padding: const EdgeInsets.only(top: 6, bottom: 12), child: Text(l.personasVipNote, style: Theme.of(context).textTheme.bodySmall)),
              for (final p in items)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: Badge(
                      isLabelVisible: (p['unread'] as int) > 0 && p['current'] != true,
                      label: Text('${p['unread']}'),
                      child: CircleAvatar(child: Text(((p['firstName'] ?? p['label'] ?? '?') as String).characters.first.toUpperCase())),
                    ),
                    title: Text([p['label'] ?? (p['isOwner'] == true ? l.profileOwner : ''), if (p['firstName'] != null) p['firstName']].where((s) => (s as String).isNotEmpty).join(' · ')),
                    subtitle: Text(p['onboarded'] == true ? (p['archetype'] as String? ?? '') : l.profileUnfinished),
                    trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                      IconButton(tooltip: l.profileRename, icon: const Icon(Icons.edit_outlined), onPressed: () => _rename(p['id'] as String, p['label'] as String?)),
                      if (p['current'] == true)
                        Chip(label: Text(l.profileCurrent))
                      else
                        BusyButton(label: l.profileSwitch, outlined: true, onPressed: () => _switch(p['id'] as String)),
                    ]),
                  ),
                ),
              const SizedBox(height: 8),
              if (items.length < max)
                OutlinedButton.icon(onPressed: _add, icon: const Icon(Icons.person_add_alt_outlined), label: Text(l.profileAdd))
              else
                Text(l.profileMax(max), style: Theme.of(context).textTheme.bodySmall),
              if (AppConfig.isAlpha) const SizedBox(height: 24),
            ]);
          },
        ),
      ),
    );
  }
}
