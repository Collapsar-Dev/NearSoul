import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../core/api.dart';
import '../../core/realtime.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import 'safety_actions.dart';

/// S25 chat: realtime, optimistic sends with idempotent retry (E4), starters from the pair report.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.matchId, this.embedded = false});
  final String matchId;
  final bool embedded;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _Msg {
  _Msg({required this.clientId, required this.body, required this.fromMe, required this.at, this.id, this.read = false, this.safetyTip = false});
  final String clientId;
  final String body;
  final bool fromMe;
  final DateTime at;
  String? id;
  bool read;
  bool failed = false;
  bool safetyTip;
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<_Msg> _msgs = [];
  Map<String, dynamic>? _other;
  List<String> _starters = [];
  bool _ended = false;
  bool _loading = true;
  Object? _error;
  StreamSubscription<RealtimeEvent>? _sub;

  Api get _api => ref.read(apiProvider);

  @override
  void initState() {
    super.initState();
    _load();
    _sub = ref.read(realtimeProvider).events.listen((e) {
      if (e.data['matchId'] != widget.matchId) return;
      if (e.name == 'message.new') {
        final m = (e.data['message'] as Map).cast<String, dynamic>();
        if (_msgs.any((x) => x.id == m['id'] || x.clientId == m['clientMessageId'])) return;
        setState(() => _msgs.add(_fromJson(m)));
        _markRead();
        _toBottom();
      } else if (e.name == 'message.read') {
        setState(() {
          for (final m in _msgs) {
            if (m.fromMe) m.read = true;
          }
        });
      } else if (e.name == 'match.ended') {
        setState(() => _ended = true);
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  _Msg _fromJson(Map<String, dynamic> m) => _Msg(
        id: m['id'] as String,
        clientId: m['clientMessageId'] as String,
        body: m['body'] as String,
        fromMe: m['fromMe'] == true,
        at: DateTime.parse(m['createdAt'] as String).toLocal(),
        read: m['read'] == true,
        safetyTip: m['safetyTip'] == true,
      );

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final res = await _api.get<Map<String, dynamic>>('/v1/matches/${widget.matchId}/messages');
      final matches = (await _api.get<List<dynamic>>('/v1/matches')).cast<Map<String, dynamic>>();
      final match = matches.where((m) => m['matchId'] == widget.matchId).firstOrNull;
      setState(() {
        _msgs
          ..clear()
          ..addAll((res['items'] as List).cast<Map<String, dynamic>>().map(_fromJson));
        _ended = res['ended'] == true || match == null;
        _other = match?['user'] as Map<String, dynamic>?;
        _loading = false;
      });
      _markRead();
      _toBottom();
      if (_msgs.isEmpty && !_ended) {
        _api.get<Map<String, dynamic>>('/v1/matches/${widget.matchId}/report').then((r) {
          if (mounted) setState(() => _starters = ((r['starters'] as List?) ?? []).cast<String>().take(3).toList());
        }).catchError((_) {});
      }
    } catch (e) {
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  void _markRead() => _api.post('/v1/matches/${widget.matchId}/read').catchError((_) => null);

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });

  Future<void> _send([_Msg? retry]) async {
    final text = retry?.body ?? _input.text.trim();
    if (text.isEmpty) return;
    final msg = retry ?? _Msg(clientId: const Uuid().v4(), body: text, fromMe: true, at: DateTime.now());
    if (retry == null) {
      _input.clear();
      setState(() => _msgs.add(msg));
      _toBottom();
    }
    try {
      final r = await _api.post<Map<String, dynamic>>('/v1/matches/${widget.matchId}/messages', {'clientMessageId': msg.clientId, 'body': text});
      setState(() {
        msg.id = r['id'] as String;
        msg.failed = false;
      });
    } on ApiError catch (e) {
      if (e.status == 404) {
        setState(() => _ended = true);
      } else {
        setState(() => msg.failed = true);
        if (!e.isNetwork && mounted) showSnack(context, errorText(context, e));
      }
    }
  }

  String get _name => (_other?['firstName'] as String?) ?? context.l.deletedUser;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: !widget.embedded,
        title: InkWell(
          onTap: _other == null ? null : () => context.push('/today/profile/${_other!['id']}'),
          child: Row(children: [
            CircleAvatar(radius: 18, backgroundImage: _other?['photo'] != null ? NetworkImage(_other!['photo'] as String) : null),
            const SizedBox(width: 10),
            Flexible(child: Text(_name, overflow: TextOverflow.ellipsis)),
          ]),
        ),
        actions: [
          if (!_ended) TextButton.icon(onPressed: () => context.push('/matches/${widget.matchId}/report'), icon: const Icon(Icons.auto_awesome, size: 18), label: Text(l.youTwo)),
          if (!_ended && _other != null)
            PopupMenuButton<String>(
              onSelected: (v) async {
                final id = _other!['id'] as String;
                if (v == 'unmatch') {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(content: Text(l.unmatchConfirm(_name)), actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.cancel)),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.unmatch)),
                    ]),
                  );
                  if (ok == true) {
                    await _api.delete('/v1/matches/${widget.matchId}');
                    if (context.mounted) context.go('/matches');
                  }
                } else if (v == 'block') {
                  if (context.mounted) await blockFlow(context, ref, userId: id, name: _name, onDone: () => context.go('/matches'));
                } else {
                  if (context.mounted) await reportFlow(context, ref, userId: id, name: _name, matchId: widget.matchId, onDone: () => context.go('/matches'));
                }
              },
              itemBuilder: (_) => [
                PopupMenuItem(value: 'unmatch', child: Text(l.unmatch)),
                PopupMenuItem(value: 'block', child: Text(l.block)),
                PopupMenuItem(value: 'report', child: Text(l.report)),
              ],
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorState(error: _error!, onRetry: _load)
              : Column(children: [
                  Expanded(
                    child: ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(16),
                      itemCount: _msgs.length,
                      itemBuilder: (context, i) {
                        final m = _msgs[i];
                        return Column(crossAxisAlignment: m.fromMe ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
                          if (m.safetyTip)
                            Container(
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                              child: Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.shield_outlined, size: 18), const SizedBox(width: 8), Flexible(child: Text(l.safetyTip))]),
                            ),
                          GestureDetector(
                            onTap: m.failed ? () => _send(m) : null,
                            child: Container(
                              constraints: const BoxConstraints(maxWidth: 520),
                              margin: const EdgeInsets.symmetric(vertical: 3),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: m.fromMe ? scheme.primary : scheme.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: SelectableText(m.body, style: TextStyle(color: m.fromMe ? Colors.white : scheme.onSurface)),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              m.failed ? l.notSent : '${DateFormat.Hm().format(m.at)}${m.fromMe && m.read ? ' · ✓✓' : ''}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: m.failed ? scheme.error : null),
                            ),
                          ),
                        ]);
                      },
                    ),
                  ),
                  if (_ended)
                    Padding(padding: const EdgeInsets.all(16), child: Text(l.conversationEnded))
                  else ...[
                    if (_starters.isNotEmpty && _msgs.isEmpty)
                      SizedBox(
                        height: 48,
                        child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
                          for (final s in _starters)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              // Starters only fill the input; the user edits and sends manually (CHAT-003).
                              child: ActionChip(label: Text(s), onPressed: () => setState(() => _input.text = s)),
                            ),
                        ]),
                      ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
                        child: Row(children: [
                          Expanded(
                            child: CallbackShortcuts(
                              bindings: {const SingleActivator(LogicalKeyboardKey.enter): () => _send()},
                              child: TextField(
                                controller: _input,
                                minLines: 1,
                                maxLines: 5,
                                maxLength: 1000,
                                buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
                                textInputAction: TextInputAction.newline,
                                decoration: InputDecoration(hintText: l.typeMessage, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(tooltip: l.send, onPressed: _send, icon: const Icon(Icons.send_rounded)),
                        ]),
                      ),
                    ),
                  ],
                ]),
    );
  }
}
