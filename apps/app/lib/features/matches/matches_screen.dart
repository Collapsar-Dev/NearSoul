import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/realtime.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../shell.dart';
import 'chat_screen.dart';
import 'liked_you_screen.dart';
import 'requests_screen.dart';

/// S24 matches list. On desktop the selected chat opens beside the list (two panes, §5.9).
class MatchesScreen extends StatelessWidget {
  const MatchesScreen({super.key});

  @override
  Widget build(BuildContext context) => const MatchesLayout(selected: null);
}

/// /matches/:id — chat full-screen on phones, two panes on wide screens.
class ChatRoute extends StatelessWidget {
  const ChatRoute({super.key, required this.matchId});
  final String matchId;

  @override
  Widget build(BuildContext context) => sizeClassOf(context) == SizeClass.compact ? ChatScreen(matchId: matchId) : MatchesLayout(selected: matchId);
}

class MatchesLayout extends ConsumerStatefulWidget {
  const MatchesLayout({super.key, required this.selected});
  final String? selected;

  @override
  ConsumerState<MatchesLayout> createState() => _MatchesLayoutState();
}

class _MatchesLayoutState extends ConsumerState<MatchesLayout> {
  List<Map<String, dynamic>>? _items;
  Map<String, dynamic>? _liked;
  List<Map<String, dynamic>> _requests = [];
  Object? _error;
  StreamSubscription<RealtimeEvent>? _sub;

  @override
  void initState() {
    super.initState();
    _load();
    _sub = ref.read(realtimeProvider).events.listen((e) {
      if (const ['message.new', 'match.new', 'match.ended', 'message.read', 'request.new'].contains(e.name)) _load();
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiProvider);
      final items = (await api.get<List<dynamic>>('/v1/matches')).cast<Map<String, dynamic>>();
      final liked = await api.get<Map<String, dynamic>>('/v1/likes/received').catchError((_) => <String, dynamic>{'count': 0});
      final requests = await api.get<List<dynamic>>('/v1/requests').then((r) => r.cast<Map<String, dynamic>>()).catchError((_) => <Map<String, dynamic>>[]);
      if (mounted) setState(() => (_items = items, _liked = liked, _requests = requests, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final list = _buildList(context);
    if (sizeClassOf(context) == SizeClass.compact || (widget.selected == null && sizeClassOf(context) == SizeClass.medium)) {
      return Scaffold(appBar: AppBar(title: NsTitle(l.matchesTitle)), body: list);
    }
    return Scaffold(
      body: Row(children: [
        SizedBox(width: 360, child: Scaffold(appBar: AppBar(automaticallyImplyLeading: false, title: NsTitle(l.matchesTitle)), body: list)),
        const VerticalDivider(width: 1),
        Expanded(
          child: widget.selected == null
              ? EmptyState(icon: Icons.chat_bubble_outline, text: l.conversations)
              : ChatScreen(key: ValueKey(widget.selected), matchId: widget.selected!, embedded: true),
        ),
      ]),
    );
  }

  Widget _buildList(BuildContext context) {
    final l = context.l;
    if (_error != null) return ErrorState(error: _error!, onRetry: _load);
    final items = _items;
    if (items == null) return const Center(child: CircularProgressIndicator());
    final likedCount = (_liked?['count'] as int?) ?? 0;
    final likedTile = likedCount == 0
        ? null
        : Card(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: ListTile(
              leading: Badge(label: Text('$likedCount'), child: const Icon(Icons.favorite)),
              title: Text(l.likedYouCount(likedCount)),
              subtitle: _liked?['canSee'] == true ? null : Text(l.likedYouUpsell),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LikedYouScreen()));
                await _load();
              },
            ),
          );
    final requestsTile = _requests.isEmpty
        ? null
        : Card(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: ListTile(
              leading: Badge(label: Text('${_requests.length}'), child: const Icon(Icons.mark_email_unread_outlined)),
              title: Text(l.requestsTitle),
              subtitle: Text(l.requestsCount(_requests.length)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RequestsScreen()));
                await _load();
              },
            ),
          );
    if (items.isEmpty && requestsTile != null) return ListView(children: [requestsTile, ?likedTile, const SizedBox(height: 40), EmptyState(icon: Icons.favorite_border, text: l.noMatches)]);
    if (items.isEmpty) return likedTile == null ? EmptyState(icon: Icons.favorite_border, text: l.noMatches) : ListView(children: [likedTile, const SizedBox(height: 40), EmptyState(icon: Icons.favorite_border, text: l.noMatches)]);
    final fresh = items.where((m) => m['lastMessage'] == null).toList();
    final convos = items.where((m) => m['lastMessage'] != null).toList();
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(children: [
        ?requestsTile,
        ?likedTile,
        if (fresh.isNotEmpty) ...[
          Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 8), child: Text(l.newMatches, style: Theme.of(context).textTheme.titleSmall)),
          SizedBox(
            height: 104,
            child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
              for (final m in fresh)
                InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => context.go('/matches/${m['matchId']}'),
                  child: Padding(
                    padding: const EdgeInsets.all(6),
                    child: Column(children: [_Avatar(user: m['user'] as Map<String, dynamic>, radius: 32), const SizedBox(height: 4), Text(_name(context, m))]),
                  ),
                ),
            ]),
          ),
        ],
        if (convos.isNotEmpty) Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 4), child: Text(l.conversations, style: Theme.of(context).textTheme.titleSmall)),
        for (final m in convos)
          ListTile(
            selected: m['matchId'] == widget.selected,
            leading: _Avatar(user: m['user'] as Map<String, dynamic>),
            title: Text(_name(context, m), style: TextStyle(fontWeight: (m['unread'] as int) > 0 ? FontWeight.w700 : FontWeight.w500)),
            subtitle: Text((m['lastMessage']['fromMe'] == true ? '✓ ' : '') + (m['lastMessage']['body'] as String), maxLines: 1, overflow: TextOverflow.ellipsis),
            trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(DateFormat.Hm().format(DateTime.parse(m['lastMessage']['createdAt'] as String).toLocal()), style: Theme.of(context).textTheme.bodySmall),
              if ((m['unread'] as int) > 0) Badge(label: Text('${m['unread']}')),
            ]),
            onTap: () => context.go('/matches/${m['matchId']}'),
          ),
      ]),
    );
  }

  String _name(BuildContext context, Map<String, dynamic> m) {
    final u = m['user'] as Map<String, dynamic>;
    return u['deleted'] == true ? context.l.deletedUser : (u['firstName'] as String? ?? '');
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.user, this.radius = 24});
  final Map<String, dynamic> user;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final photo = user['photo'] as String?;
    return CircleAvatar(
      radius: radius,
      backgroundImage: photo != null ? NetworkImage(photo) : null,
      child: photo == null ? const Icon(Icons.person) : null,
    );
  }
}
