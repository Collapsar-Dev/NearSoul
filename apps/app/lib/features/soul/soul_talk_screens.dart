import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import '../../core/api.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// S28/S29/S33 Soul Talk home: consent gate, topics, Soul Map and privacy (SOUL-001, SOUL-004, SOUL-007).
class SoulTalkScreen extends ConsumerStatefulWidget {
  const SoulTalkScreen({super.key});

  @override
  ConsumerState<SoulTalkScreen> createState() => _SoulTalkScreenState();
}

class _SoulTalkScreenState extends ConsumerState<SoulTalkScreen> {
  Map<String, dynamic>? _topics;
  bool _needsConsent = false;
  Object? _error;

  Api get _api => ref.read(apiProvider);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final t = await _api.get<Map<String, dynamic>>('/v1/soul/topics');
      setState(() {
        _topics = t;
        _needsConsent = false;
        _error = null;
      });
    } on ApiError catch (e) {
      setState(() => e.code == 'SOUL_CONSENT_REQUIRED' ? _needsConsent = true : _error = e);
    }
  }

  Future<void> _open(Map<String, dynamic> topic) async {
    try {
      final id = topic['activeSessionId'] as String? ??
          (await _api.post<Map<String, dynamic>>('/v1/soul/sessions', {'topicKey': topic['key']}))['id'] as String;
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => SoulSessionScreen(sessionId: id)));
      _load();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.soulTalk), actions: [
        if (_topics != null) ...[
          IconButton(tooltip: l.soulMap, icon: const Icon(Icons.map_outlined), onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SoulMapScreen()))),
          PopupMenuButton<String>(
            onSelected: (v) => v == 'privacy' ? _privacy() : null,
            itemBuilder: (_) => [PopupMenuItem(value: 'privacy', child: Text(l.settings))],
          ),
        ],
      ]),
      body: _error != null
          ? ErrorState(error: _error!, onRetry: _load)
          : _needsConsent
              ? _intro(context)
              : _topics == null
                  ? const Center(child: CircularProgressIndicator())
                  : _list(context),
    );
  }

  Widget _intro(BuildContext context) {
    final l = context.l;
    return FocusColumn(
      child: ListView(children: [
        const SizedBox(height: 24),
        Icon(Icons.forum_outlined, size: 64, color: Theme.of(context).colorScheme.secondary),
        const SizedBox(height: 16),
        Text(l.soulTalkIntroTitle, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        Text(l.soulTalkIntroBody, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 16),
        Card(child: ListTile(leading: const Icon(Icons.health_and_safety_outlined), title: Text(l.soulNotTherapy))),
        const SizedBox(height: 8),
        Card(child: ListTile(leading: const Icon(Icons.lock_outline), title: Text(l.soulPrivacy))),
        const SizedBox(height: 24),
        BusyButton(
          label: l.soulConsentCta,
          onPressed: () async {
            await _api.post('/v1/me/consents', {'optional': {'ai_self_discovery': true}});
            await _load();
          },
        ),
      ]),
    );
  }

  Widget _list(BuildContext context) {
    final l = context.l;
    final topics = (_topics!['topics'] as List).cast<Map<String, dynamic>>();
    final suggested = _topics!['suggested'] as String?;
    return FocusColumn(
      maxWidth: 680,
      child: ListView(children: [
        const SizedBox(height: 8),
        Text(l.soulNotTherapy, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 12),
        for (final t in topics)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              shape: t['key'] == suggested
                  ? RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: Theme.of(context).colorScheme.secondary, width: 2))
                  : null,
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                title: Text(t['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text([if (t['key'] == suggested) l.soulSuggested, t['description'] as String].join(' · ')),
                trailing: t['activeSessionId'] != null
                    ? Chip(label: Text(l.soulResume))
                    : t['done'] == true
                        ? Chip(avatar: const Icon(Icons.check, size: 16), label: Text(l.soulDoneBadge))
                        : const Icon(Icons.chevron_right),
                onTap: () => _open(t),
              ),
            ),
          ),
      ]),
    );
  }

  Future<void> _privacy() async {
    final l = context.l;
    final me = ref.read(sessionProvider).me;
    var keep = me?.json['soulKeepConversations'] == true;
    await showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(l.soulPrivacy, style: Theme.of(ctx).textTheme.bodySmall),
              SwitchListTile(
                title: Text(l.soulKeepConversations),
                value: keep,
                onChanged: (v) async {
                  setSheet(() => keep = v);
                  await _api.patch('/v1/me/soul-settings', {'keepConversations': v});
                  await ref.read(sessionProvider.notifier).reloadMe();
                },
              ),
              ListTile(
                leading: Icon(Icons.delete_outline, color: Theme.of(ctx).colorScheme.error),
                title: Text(l.soulDeleteAll, style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                onTap: () async {
                  final ok = await showDialog<bool>(
                    context: ctx,
                    builder: (d) => AlertDialog(content: Text(l.soulDeleteAllConfirm), actions: [
                      TextButton(onPressed: () => Navigator.pop(d, false), child: Text(l.cancel)),
                      FilledButton(onPressed: () => Navigator.pop(d, true), child: Text(l.soulDeleteAll)),
                    ]),
                  );
                  if (ok != true) return;
                  await _api.delete('/v1/soul/data');
                  if (ctx.mounted) Navigator.pop(ctx);
                  _load();
                },
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// S30 Soul Talk session: one question at a time, quick replies, safety sheet, retries with the same key.
class SoulSessionScreen extends ConsumerStatefulWidget {
  const SoulSessionScreen({super.key, required this.sessionId});
  final String sessionId;

  @override
  ConsumerState<SoulSessionScreen> createState() => _SoulSessionScreenState();
}

class _SoulSessionScreenState extends ConsumerState<SoulSessionScreen> {
  Map<String, dynamic>? _session;
  final List<Map<String, dynamic>> _msgs = [];
  List<String> _chips = [];
  bool _waiting = false;
  String? _pendingText;
  String? _pendingKey;
  bool _failed = false;
  final _input = TextEditingController();
  final _scroll = ScrollController();

  Api get _api => ref.read(apiProvider);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = await _api.get<Map<String, dynamic>>('/v1/soul/sessions/${widget.sessionId}');
    setState(() {
      _session = s;
      _msgs
        ..clear()
        ..addAll((s['messages'] as List).cast<Map<String, dynamic>>());
    });
    _toBottom();
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });

  Future<void> _send([String? preset]) async {
    final text = _pendingText ?? (preset ?? _input.text).trim();
    if (text.isEmpty || _waiting) return;
    _pendingKey ??= const Uuid().v4();
    if (_pendingText == null) {
      _pendingText = text;
      _input.clear();
      setState(() => _msgs.add({'role': 'user', 'text': text}));
    }
    setState(() {
      _waiting = true;
      _failed = false;
      _chips = [];
    });
    _toBottom();
    try {
      final r = await _api.post<Map<String, dynamic>>('/v1/soul/sessions/${widget.sessionId}/messages', {'text': text}, {'idempotency-key': _pendingKey!});
      _pendingText = null;
      _pendingKey = null;
      if (r['safety'] != null) {
        setState(() => _msgs.add({'role': 'system_fixed', 'text': (r['safety'] as Map)['message']}));
        if (mounted) await _safetySheet((r['safety'] as Map).cast<String, dynamic>());
      } else {
        setState(() {
          _msgs.add({'role': 'guide', 'text': (r['reply'] as Map)['text']});
          _chips = ((r['chips'] as List?) ?? []).cast<String>();
        });
      }
    } on ApiError catch (e) {
      if (e.code == 'SESSION_CLOSED' || e.code == 'TURN_LIMIT') {
        _pendingText = null;
        _pendingKey = null;
        await _finish();
        return;
      }
      setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _waiting = false);
      _toBottom();
    }
  }

  Future<void> _safetySheet(Map<String, dynamic> s) async {
    final l = context.l;
    final resources = ((s['resources'] as List?) ?? []).cast<Map<String, dynamic>>();
    final underage = s['category'] == 'underage';
    final cont = await showModalBottomSheet<bool>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Icon(Icons.favorite_outline, size: 40),
            const SizedBox(height: 12),
            Text(s['message'] as String, style: Theme.of(ctx).textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final r in resources)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.call_outlined),
                  title: Text(r['name'] as String),
                  subtitle: Text([r['phone'], r['url']].whereType<String>().join(' · ')),
                  onTap: () => launchUrl(Uri.parse(r['phone'] != null ? 'tel:${r['phone']}' : r['url'] as String)),
                ),
              ),
            const SizedBox(height: 12),
            if (!underage) FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.soulSafetyContinue)),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.soulSafetyEnd)),
          ]),
        ),
      ),
    );
    if (cont == true) {
      await _api.post('/v1/soul/sessions/${widget.sessionId}/continue');
    } else if (mounted) {
      Navigator.of(context).pop();
    }
  }

  Future<void> _finish() async {
    try {
      final w = await _api.post<Map<String, dynamic>>('/v1/soul/sessions/${widget.sessionId}/finish');
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => SoulWrapUpScreen(data: w)));
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final s = _session;
    final scheme = Theme.of(context).colorScheme;
    final open = s != null && s['canResume'] == true;
    return Scaffold(
      appBar: AppBar(
        title: Text((s?['title'] as String?) ?? l.soulTalk, overflow: TextOverflow.ellipsis),
        actions: [if (s != null) BusyButtonText(label: l.soulEnd, onPressed: _finish)],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(22),
          child: Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(l.soulNotTherapy, style: Theme.of(context).textTheme.bodySmall)),
        ),
      ),
      body: s == null
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Expanded(
                child: FocusColumn(
                  maxWidth: 720,
                  child: ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    itemCount: _msgs.length + (_waiting ? 1 : 0),
                    itemBuilder: (context, i) {
                      if (i == _msgs.length) return Padding(padding: const EdgeInsets.all(8), child: Text(l.soulThinking, style: Theme.of(context).textTheme.bodySmall));
                      final m = _msgs[i];
                      final mine = m['role'] == 'user';
                      final fixed = m['role'] == 'system_fixed';
                      return Align(
                        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: const BoxConstraints(maxWidth: 560),
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: fixed ? Colors.amber.withValues(alpha: 0.18) : mine ? scheme.primary : scheme.secondary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: SelectableText(m['text'] as String, style: TextStyle(color: mine ? Colors.white : null, height: 1.4)),
                        ),
                      );
                    },
                  ),
                ),
              ),
              if (_failed)
                TextButton.icon(onPressed: _send, icon: const Icon(Icons.refresh), label: Text(l.soulRetry)),
              if (_chips.isNotEmpty && open)
                SizedBox(
                  height: 48,
                  child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
                    for (final c in _chips) Padding(padding: const EdgeInsets.only(right: 8), child: ActionChip(label: Text(c), onPressed: () => _send(c))),
                  ]),
                ),
              if (open)
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
                    child: Row(children: [
                      Expanded(
                        child: TextField(
                          controller: _input,
                          minLines: 1,
                          maxLines: 5,
                          maxLength: 2000,
                          buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
                          decoration: InputDecoration(hintText: l.typeMessage),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(tooltip: l.send, onPressed: _waiting ? null : () => _send(), icon: const Icon(Icons.send_rounded)),
                    ]),
                  ),
                ),
            ]),
    );
  }
}

/// Small text button with busy state for app bars.
class BusyButtonText extends StatefulWidget {
  const BusyButtonText({super.key, required this.label, required this.onPressed});
  final String label;
  final Future<void> Function() onPressed;

  @override
  State<BusyButtonText> createState() => _BusyButtonTextState();
}

class _BusyButtonTextState extends State<BusyButtonText> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: _busy
            ? null
            : () async {
                setState(() => _busy = true);
                await widget.onPressed();
                if (mounted) setState(() => _busy = false);
              },
        child: _busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : Text(widget.label),
      );
}

String categoryLabel(BuildContext context, String c) {
  final l = context.l;
  return switch (c) {
    'value' => l.catValue,
    'need' => l.catNeed,
    'pattern' => l.catPattern,
    'strength' => l.catStrength,
    'preference' => l.catPreference,
    _ => l.catGrowth,
  };
}

/// S31 wrap-up: nothing is saved until the user keeps an insight (SOUL-003).
class SoulWrapUpScreen extends ConsumerStatefulWidget {
  const SoulWrapUpScreen({super.key, required this.data});
  final Map<String, dynamic> data;

  @override
  ConsumerState<SoulWrapUpScreen> createState() => _SoulWrapUpScreenState();
}

class _SoulWrapUpScreenState extends ConsumerState<SoulWrapUpScreen> {
  late final List<Map<String, dynamic>> _insights = ((widget.data['insights'] as List?) ?? []).cast<Map<String, dynamic>>().map((m) => Map<String, dynamic>.of(m)).toList();

  Future<void> _update(Map<String, dynamic> i, Map<String, dynamic> body) async {
    try {
      final r = await ref.read(apiProvider).patch<Map<String, dynamic>>('/v1/soul/insights/${i['id']}', body);
      setState(() {
        if (r['status'] == 'discarded') {
          _insights.removeWhere((x) => x['id'] == i['id']);
        } else {
          i
            ..['status'] = r['status']
            ..['visibility'] = r['visibility']
            ..['text'] = r['text'];
        }
      });
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  Future<void> _edit(Map<String, dynamic> i) async {
    final ctl = TextEditingController(text: i['text'] as String);
    final l = context.l;
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: TextField(controller: ctl, maxLength: 140, maxLines: 3),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l.cancel)), FilledButton(onPressed: () => Navigator.pop(ctx, ctl.text.trim()), child: Text(l.soulKeep))],
      ),
    );
    if (text != null && text.length >= 3) await _update(i, {'text': text, 'status': 'kept'});
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final d = widget.data;
    return Scaffold(
      appBar: AppBar(title: Text(l.soulWrapTitle)),
      body: FocusColumn(
        maxWidth: 680,
        child: ListView(children: [
          const SizedBox(height: 8),
          if (d['tooShort'] == true) Text(l.soulTooShort),
          if (d['summary'] != null) Text(d['summary'] as String, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 16),
          for (final i in _insights)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Chip(label: Text(categoryLabel(context, i['category'] as String)), visualDensity: VisualDensity.compact),
                      const Spacer(),
                      if (i['affectsMatching'] == true) Text(l.soulAffectsMatching, style: Theme.of(context).textTheme.bodySmall),
                    ]),
                    const SizedBox(height: 8),
                    Text(i['text'] as String, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(l.soulBasedOn(i['evidence'] as String), style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 12),
                    if (i['status'] == 'kept')
                      DropdownButton<String>(
                        value: i['visibility'] as String,
                        onChanged: (v) => _update(i, {'visibility': v}),
                        items: [
                          DropdownMenuItem(value: 'private', child: Text(l.soulVisPrivate)),
                          if (i['affectsMatching'] == true) DropdownMenuItem(value: 'matching', child: Text(l.soulVisMatching)),
                          DropdownMenuItem(value: 'card', child: Text(l.soulVisCard)),
                        ],
                      )
                    else
                      Wrap(spacing: 8, children: [
                        FilledButton.tonal(onPressed: () => _update(i, {'status': 'kept'}), child: Text(l.soulKeep)),
                        OutlinedButton(onPressed: () => _edit(i), child: Text(l.cardEdit)),
                        TextButton(onPressed: () => _update(i, {'status': 'discarded'}), child: Text(l.soulDiscard)),
                      ]),
                  ]),
                ),
              ),
            ),
          if (d['questionToSitWith'] != null) ...[
            SectionTitle(l.soulQuestion),
            Text(d['questionToSitWith'] as String, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontStyle: FontStyle.italic)),
          ],
          const SizedBox(height: 24),
          FilledButton(onPressed: () => Navigator.of(context).pop(), child: Text(l.done)),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }
}

/// S34 Soul Map: kept insights by category.
class SoulMapScreen extends ConsumerStatefulWidget {
  const SoulMapScreen({super.key});

  @override
  ConsumerState<SoulMapScreen> createState() => _SoulMapScreenState();
}

class _SoulMapScreenState extends ConsumerState<SoulMapScreen> {
  late final Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/me/soul-map');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.soulMap)),
      body: AsyncBody<Map<String, dynamic>>(
        future: _f,
        builder: (context, m) {
          if ((m['count'] as int) == 0) return EmptyState(icon: Icons.map_outlined, text: l.soulMapEmpty);
          final groups = (m['byCategory'] as Map).cast<String, dynamic>();
          return FocusColumn(
            maxWidth: 680,
            child: ListView(children: [
              for (final e in groups.entries)
                if ((e.value as List).isNotEmpty) ...[
                  SectionTitle(categoryLabel(context, e.key)),
                  for (final i in (e.value as List).cast<Map<String, dynamic>>())
                    Card(child: ListTile(title: Text(i['text'] as String), subtitle: Text(l.soulBasedOn(i['evidence'] as String)))),
                ],
              const SizedBox(height: 24),
            ]),
          );
        },
      ),
    );
  }
}
