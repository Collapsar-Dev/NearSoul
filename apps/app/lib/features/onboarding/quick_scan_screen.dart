import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import 'onboarding_screens.dart';
import '../../core/widgets/common.dart';

/// ENG-002 Quick Scan: one question per screen, saved one by one, resumable.
class QuickScanScreen extends ConsumerStatefulWidget {
  const QuickScanScreen({super.key, this.retake = false, this.questionnaire = 'quick_scan', this.refine = false});
  final bool retake;

  /// Soul tab "Refine your profile": only the Quick Scan questions not answered yet (CR-21).
  final bool refine;

  /// 'quick_scan' or 'deep_1'..'deep_4' (Deep Personality, ENG-003).
  final String questionnaire;

  bool get isDeep => questionnaire.startsWith('deep_');

  @override
  ConsumerState<QuickScanScreen> createState() => _QuickScanScreenState();
}

class _Item {
  _Item(this.block, this.json);
  final String block;
  final Map<String, dynamic> json;
  String get key => json['key'] as String;
  String get type => json['type'] as String;
  bool get optional => json['optional'] == true;
}

class _QuickScanScreenState extends ConsumerState<QuickScanScreen> {
  List<_Item> _items = [];
  List<String> _likert = [];
  final Map<String, dynamic> _answers = {};
  final Map<String, dynamic> _pending = {};
  int _index = 0;
  bool _intro = true;
  bool _loading = true;
  String? _interlude;
  Object? _error;
  Timer? _advance;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiProvider);
      final q = await api.get<Map<String, dynamic>>('/v1/engine/questionnaires/${widget.questionnaire}');
      final progress = await api.get<Map<String, dynamic>>('/v1/engine/progress');
      final items = <_Item>[];
      for (final b in (q['blocks'] as List).cast<Map<String, dynamic>>()) {
        for (final i in (b['items'] as List).cast<Map<String, dynamic>>()) {
          items.add(_Item(b['key'] as String, i));
        }
      }
      final answered = ((progress['answered'] as List?) ?? []).cast<String>().toSet();
      // Onboarding and retakes ask only the 10 starter questions; "refine" asks the rest (CR-21).
      if (!widget.isDeep) {
        if (widget.refine) {
          items.retainWhere((i) => i.json['starter'] != true && !answered.contains(i.key));
        } else {
          items.retainWhere((i) => i.json['starter'] == true);
        }
      }
      final firstOpen = items.indexWhere((i) => !answered.contains(i.key));
      setState(() {
        _items = items;
        _likert = (q['likertLabels'] as List).cast<String>();
        _index = widget.retake ? 0 : (firstOpen < 0 ? items.length - 1 : firstOpen);
        final partStarted = items.any((i) => answered.contains(i.key));
        _intro = widget.isDeep ? !partStarted : (answered.isEmpty || widget.retake);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _save(String key, dynamic value) async {
    _pending[key] = value;
    final api = ref.read(apiProvider);
    // Flush everything pending (earlier failures included) — offline answers are retried, never lost (E3).
    for (final entry in Map.of(_pending).entries) {
      try {
        await api.put('/v1/engine/answers/${entry.key}', {'value': entry.value});
        _pending.remove(entry.key);
      } on ApiError catch (e) {
        if (!e.isNetwork) {
          _pending.remove(entry.key);
          rethrow;
        }
      }
    }
  }

  String _blockTitle(String b) {
    final l = context.l;
    if (b.startsWith('P')) return l.deepPart(int.parse(b.substring(1)));
    return switch (b) { 'A' => l.blockA, 'B' => l.blockB, 'C' => l.blockC, 'D' => l.blockD, _ => l.blockX };
  }

  Future<void> _answer(dynamic value) async {
    final item = _items[_index];
    _answers[item.key] = value;
    try {
      await _save(item.key, value);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
      return;
    }
    if (_pending.isNotEmpty && mounted) showSnack(context, context.l.offline);
    _next();
  }

  void _next() {
    if (_index >= _items.length - 1) {
      _finish();
      return;
    }
    final crossing = _items[_index].block != _items[_index + 1].block;
    setState(() {
      _index++;
      _interlude = crossing ? _blockTitle(_items[_index].block) : null;
    });
    if (crossing) {
      _advance?.cancel();
      _advance = Timer(const Duration(milliseconds: 1400), () {
        if (mounted) setState(() => _interlude = null);
      });
    }
  }

  Future<void> _finish() async {
    if (_pending.isNotEmpty) {
      showSnack(context, context.l.offline);
      return;
    }
    if (widget.isDeep) {
      if (mounted) {
        showSnack(context, context.l.deepPartDone);
        Navigator.of(context).pop(true);
      }
      return;
    }
    await ref.read(sessionProvider.notifier).reloadMe();
    if ((widget.retake || widget.refine) && mounted) Navigator.of(context).pop(true);
  }

  @override
  void dispose() {
    _advance?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_error != null) return Scaffold(body: ErrorState(error: _error!, onRetry: _load));
    if (_intro) {
      return Scaffold(
        appBar: Navigator.of(context).canPop() || ref.watch(sessionProvider).me?.isPersona == true ? AppBar(actions: const [ProfilesShortcut()]) : null,
        body: SafeArea(
          child: FocusColumn(
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.auto_awesome, size: 72, color: Theme.of(context).colorScheme.secondary),
              const SizedBox(height: 24),
              Text(widget.isDeep ? '${l.deepPersonality} · ${_blockTitle(_items.first.block)}' : l.scanIntroTitle, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text(widget.isDeep ? l.deepIntro : l.scanIntroBody, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 32),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: () => setState(() => _intro = false), child: Text(l.scanStart))),
            ]),
          ),
        ),
      );
    }
    final item = _items[_index];
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        leading: _index > 0 ? IconButton(tooltip: l.back, icon: const Icon(Icons.arrow_back), onPressed: () => setState(() => _index--)) : null,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_blockTitle(item.block), style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          LinearProgressIndicator(value: (_index + 1) / _items.length, borderRadius: BorderRadius.circular(8)),
        ]),
        actions: [
          if (!widget.isDeep && !widget.retake) const ProfilesShortcut(),
          // Every question can be skipped (null); the engine just has less to go on.
          TextButton(onPressed: () => _answer(item.optional ? <String>[] : null), child: Text(l.skip)),
          const TestBadge(),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 250),
          child: _interlude != null
              ? Center(
                  key: const ValueKey('interlude'),
                  child: Text(l.scanInterlude(_interlude!), style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: scheme.secondary), textAlign: TextAlign.center),
                )
              : FocusColumn(
                  key: ValueKey(item.key),
                  child: ListView(children: [
                    const SizedBox(height: 16),
                    Text(l.scanProgress(_index + 1, _items.length), style: Theme.of(context).textTheme.labelMedium),
                    const SizedBox(height: 12),
                    if (item.type == 'likert5' && (item.block == 'A' || item.block.startsWith('P'))) Text(l.scanHowAccurate, style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    Text(item.json['prompt'] as String, style: Theme.of(context).textTheme.headlineSmall),
                    if (item.json['translated'] == false)
                      Padding(padding: const EdgeInsets.only(top: 6), child: Text(l.untranslated, style: Theme.of(context).textTheme.bodySmall)),
                    const SizedBox(height: 24),
                    _input(item),
                  ]),
                ),
        ),
      ),
    );
  }

  Widget _input(_Item item) {
    final l = context.l;
    final current = _answers[item.key];
    switch (item.type) {
      case 'likert5':
        final anchors = item.json['anchors'] as Map<String, dynamic>?;
        final low = anchors?['low'] as String?;
        final high = anchors?['high'] as String?;
        // Two-ended scales label every point, so no option shows up as a bare number.
        final labels = anchors == null ? _likert : [low!, l.scaleLean(low), l.scaleMiddle, l.scaleLean(high!), high];
        return Column(children: [
          for (var v = 1; v <= 5; v++)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SizedBox(
                width: double.infinity,
                child: (current == v ? FilledButton.tonal : OutlinedButton.new)(
                  onPressed: () => _answer(v),
                  child: Row(children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: Theme.of(context).colorScheme.secondary.withValues(alpha: 0.08 + v * 0.06)),
                      child: Text('$v'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(labels[v - 1].isEmpty ? '' : labels[v - 1])),
                  ]),
                ),
              ),
            ),
        ]);
      case 'single':
        return Column(children: [
          for (final o in (item.json['options'] as List).cast<Map<String, dynamic>>())
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SizedBox(
                width: double.infinity,
                child: (current == o['key'] ? FilledButton.tonal : OutlinedButton.new)(
                  onPressed: () => _answer(o['key']),
                  child: Align(alignment: Alignment.centerLeft, child: Text(o['label'] as String)),
                ),
              ),
            ),
        ]);
      default:
        return _MultiInput(
          item: item.json,
          initial: (current as List?)?.cast<String>() ?? const [],
          hint: item.json['minSelect'] == item.json['maxSelect'] ? l.pickExactly(item.json['maxSelect'] as int) : l.pickUpTo(item.json['maxSelect'] as int),
          onDone: (v) => _answer(v),
          doneLabel: l.continueBtn,
        );
    }
  }
}

class _MultiInput extends StatefulWidget {
  const _MultiInput({required this.item, required this.initial, required this.hint, required this.onDone, required this.doneLabel});
  final Map<String, dynamic> item;
  final List<String> initial;
  final String hint;
  final String doneLabel;
  final void Function(List<String>) onDone;

  @override
  State<_MultiInput> createState() => _MultiInputState();
}

class _MultiInputState extends State<_MultiInput> {
  late final Set<String> _sel = {...widget.initial};

  @override
  Widget build(BuildContext context) {
    final min = (widget.item['minSelect'] as int?) ?? 0;
    final max = (widget.item['maxSelect'] as int?) ?? 99;
    final ok = _sel.length >= min && _sel.length <= max;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.hint, style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 12),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final o in (widget.item['options'] as List).cast<Map<String, dynamic>>())
          FilterChip(
            label: Text(o['label'] as String),
            selected: _sel.contains(o['key']),
            onSelected: (s) => setState(() {
              if (s && _sel.length < max) _sel.add(o['key'] as String);
              if (!s) _sel.remove(o['key']);
            }),
          ),
      ]),
      const SizedBox(height: 24),
      SizedBox(width: double.infinity, child: FilledButton(onPressed: ok ? () => widget.onDone(_sel.toList()) : null, child: Text(widget.doneLabel))),
    ]);
  }
}
