import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../core/config.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// Shared layout for onboarding steps: progress, title, body, primary action.
class StepScaffold extends StatelessWidget {
  const StepScaffold({super.key, required this.step, required this.title, this.subtitle, required this.children, this.action, this.total = 8});
  final int step;
  final int total;
  final String title;
  final String? subtitle;
  final List<Widget> children;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: LinearProgressIndicator(value: step / total, borderRadius: BorderRadius.circular(8)), actions: const [TestBadge(), SizedBox(width: 12)]),
        body: SafeArea(
          child: FocusColumn(
            child: Column(children: [
              Expanded(
                child: ListView(children: [
                  const SizedBox(height: 8),
                  Text(title, style: Theme.of(context).textTheme.headlineMedium),
                  if (subtitle != null) ...[const SizedBox(height: 8), Text(subtitle!, style: Theme.of(context).textTheme.bodyLarge)],
                  const SizedBox(height: 24),
                  ...children,
                ]),
              ),
              if (action != null) Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: SizedBox(width: double.infinity, child: action)),
            ]),
          ),
        ),
      );
}

class DobScreen extends ConsumerStatefulWidget {
  const DobScreen({super.key});

  @override
  ConsumerState<DobScreen> createState() => _DobScreenState();
}

class _DobScreenState extends ConsumerState<DobScreen> {
  DateTime? _dob;

  int? get _age {
    final d = _dob;
    if (d == null) return null;
    final now = DateTime.now();
    var a = now.year - d.year;
    if (now.month < d.month || (now.month == d.month && now.day < d.day)) a--;
    return a;
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return StepScaffold(
      step: 1,
      title: l.dobTitle,
      subtitle: l.dobHint,
      action: BusyButton(
        label: l.continueBtn,
        onPressed: _dob == null
            ? null
            : () async {
                await ref.read(apiProvider).post('/v1/me/dob', {'dob': DateFormat('yyyy-MM-dd').format(_dob!)});
                await ref.read(sessionProvider.notifier).reloadMe();
              },
      ),
      children: [
        OutlinedButton.icon(
          icon: const Icon(Icons.cake_outlined),
          label: Text(_dob == null ? l.dobPick : DateFormat.yMMMMd(Localizations.localeOf(context).languageCode).format(_dob!)),
          onPressed: () async {
            final now = DateTime.now();
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime(now.year - 25),
              firstDate: DateTime(now.year - 100),
              lastDate: now,
              initialEntryMode: DatePickerEntryMode.input,
            );
            if (picked != null) setState(() => _dob = picked);
          },
        ),
        if (_age != null) ...[const SizedBox(height: 16), Text(l.dobConfirm(_age!), style: Theme.of(context).textTheme.titleMedium)],
      ],
    );
  }
}

class ConsentsScreen extends ConsumerStatefulWidget {
  const ConsentsScreen({super.key});

  @override
  ConsumerState<ConsentsScreen> createState() => _ConsentsScreenState();
}

class _ConsentsScreenState extends ConsumerState<ConsentsScreen> {
  bool _terms = false, _alpha = false, _ai = false, _analytics = false, _emails = false;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final alpha = AppConfig.isAlpha;
    final ready = _terms && (!alpha || _alpha);
    return StepScaffold(
      step: 2,
      title: l.consentTitle,
      action: BusyButton(
        label: l.continueBtn,
        onPressed: ready
            ? () async {
                await ref.read(apiProvider).post('/v1/me/consents', {
                  'terms': true,
                  if (alpha) 'alphaTerms': true,
                  'optional': {'ai_writing': _ai, 'analytics': _analytics, 'product_emails': _emails},
                });
                await ref.read(sessionProvider.notifier).reloadMe();
              }
            : null,
      ),
      children: [
        CheckboxListTile(value: _terms, onChanged: (v) => setState(() => _terms = v!), title: Text(l.consentTerms), controlAffinity: ListTileControlAffinity.leading),
        if (alpha) CheckboxListTile(value: _alpha, onChanged: (v) => setState(() => _alpha = v!), title: Text(l.consentAlpha), controlAffinity: ListTileControlAffinity.leading),
        const Divider(height: 32),
        SwitchListTile(value: _ai, onChanged: (v) => setState(() => _ai = v), title: Text(l.consentAi), subtitle: Text(l.consentAiHint)),
        SwitchListTile(value: _analytics, onChanged: (v) => setState(() => _analytics = v), title: Text(l.consentAnalytics)),
        SwitchListTile(value: _emails, onChanged: (v) => setState(() => _emails = v), title: Text(l.consentEmails)),
      ],
    );
  }
}

class ShareLevelScreen extends ConsumerStatefulWidget {
  const ShareLevelScreen({super.key, this.inSettings = false});
  final bool inSettings;

  @override
  ConsumerState<ShareLevelScreen> createState() => _ShareLevelScreenState();
}

class _ShareLevelScreenState extends ConsumerState<ShareLevelScreen> {
  String? _level;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final options = [('minimal', l.shareMinimal, l.shareMinimalDesc), ('standard', l.shareStandard, l.shareStandardDesc), ('deep', l.shareDeep, l.shareDeepDesc)];
    return StepScaffold(
      step: 4,
      title: l.shareTitle,
      subtitle: l.shareReciprocity,
      action: BusyButton(
        label: l.continueBtn,
        onPressed: _level == null
            ? null
            : () async {
                await ref.read(apiProvider).patch('/v1/me/share-level', {'level': _level});
                await ref.read(sessionProvider.notifier).reloadMe();
                if (widget.inSettings && context.mounted) context.pop();
              },
      ),
      children: [
        // No preselection (RPT-003); Standard is only visually recommended.
        RadioGroup<String>(
          groupValue: _level,
          onChanged: (v) => setState(() => _level = v),
          child: Column(children: [
            for (final o in options)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: o.$1 == 'standard' ? Theme.of(context).colorScheme.secondary : Theme.of(context).colorScheme.outlineVariant, width: o.$1 == 'standard' ? 2 : 1),
                  ),
                  child: RadioListTile<String>(value: o.$1, title: Text(o.$2, style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(o.$3)),
                ),
              ),
          ]),
        ),
      ],
    );
  }
}

class BasicsScreen extends ConsumerStatefulWidget {
  const BasicsScreen({super.key});

  @override
  ConsumerState<BasicsScreen> createState() => _BasicsScreenState();
}

class _BasicsScreenState extends ConsumerState<BasicsScreen> {
  final _name = TextEditingController();
  String? _gender;
  final Set<String> _interested = {};
  String? _intent;
  late RangeValues _ages = RangeValues(((ref.read(sessionProvider).me?.age ?? 25) - 5).clamp(18, 99).toDouble(), ((ref.read(sessionProvider).me?.age ?? 25) + 5).clamp(18, 99).toDouble());

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final genders = [('woman', l.genderWoman), ('man', l.genderMan), ('non_binary', l.genderNonBinary)];
    final interested = [('woman', l.women), ('man', l.men), ('non_binary', l.nonBinaryPeople)];
    final intents = [('long_term', l.intentLong), ('open_to_long', l.intentOpen), ('casual', l.intentCasual), ('not_sure', l.intentNotSure)];
    final ready = _name.text.trim().isNotEmpty && _gender != null && _interested.isNotEmpty && _intent != null;
    return StepScaffold(
      step: 5,
      title: l.basicsTitle,
      action: BusyButton(
        label: l.continueBtn,
        onPressed: !ready
            ? null
            : () async {
                await ref.read(apiProvider).put('/v1/me/profile', {
                  'firstName': _name.text.trim(),
                  'gender': _gender,
                  'interestedIn': _interested.toList(),
                  'intent': _intent,
                  'ageMin': _ages.start.round(),
                  'ageMax': _ages.end.round(),
                  'cityId': 'amsterdam',
                });
                await ref.read(sessionProvider.notifier).reloadMe();
              },
      ),
      children: [
        TextField(controller: _name, maxLength: 30, textCapitalization: TextCapitalization.words, decoration: InputDecoration(labelText: l.firstName), onChanged: (_) => setState(() {})),
        SectionTitle(l.iAm),
        Wrap(spacing: 8, runSpacing: 8, children: [for (final g in genders) ChoiceChip(label: Text(g.$2), selected: _gender == g.$1, onSelected: (_) => setState(() => _gender = g.$1))]),
        SectionTitle(l.interestedIn),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final g in interested)
            FilterChip(label: Text(g.$2), selected: _interested.contains(g.$1), onSelected: (s) => setState(() => s ? _interested.add(g.$1) : _interested.remove(g.$1))),
        ]),
        SectionTitle(l.lookingFor),
        for (final i in intents)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ChoiceChip(label: SizedBox(width: double.infinity, child: Text(i.$2)), selected: _intent == i.$1, onSelected: (_) => setState(() => _intent = i.$1)),
          ),
        SectionTitle(l.ageRange(_ages.start.round(), _ages.end.round())),
        RangeSlider(values: _ages, min: 18, max: 99, divisions: 81, labels: RangeLabels('${_ages.start.round()}', '${_ages.end.round()}'), onChanged: (v) => setState(() => _ages = v)),
      ],
    );
  }
}

/// Photo grid used in onboarding and in Me → Photos.
class PhotosScreen extends ConsumerStatefulWidget {
  const PhotosScreen({super.key, required this.onboarding});
  final bool onboarding;

  @override
  ConsumerState<PhotosScreen> createState() => _PhotosScreenState();
}

class _PhotosScreenState extends ConsumerState<PhotosScreen> {
  List<Map<String, dynamic>> _photos = [];
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/profile');
    if (mounted) setState(() => _photos = (res['photos'] as List).cast<Map<String, dynamic>>());
  }

  Future<void> _add(ImageSource source) async {
    final file = await ImagePicker().pickImage(source: source, maxWidth: 2400, imageQuality: 92);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final bytes = await file.readAsBytes();
      await ref.read(apiProvider).upload('/v1/photos', 'photo', bytes, file.name.isEmpty ? 'photo.jpg' : file.name);
      await _load();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _remove(String id) async {
    try {
      await ref.read(apiProvider).delete('/v1/photos/$id');
      await _load();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    }
  }

  void _pickSource() {
    final l = context.l;
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(leading: const Icon(Icons.photo_library_outlined), title: Text(l.fromGallery), onTap: () {
            Navigator.pop(ctx);
            _add(ImageSource.gallery);
          }),
          ListTile(leading: const Icon(Icons.photo_camera_outlined), title: Text(l.fromCamera), onTap: () {
            Navigator.pop(ctx);
            _add(ImageSource.camera);
          }),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final grid = GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 4 / 5,
      children: [
        for (var i = 0; i < 6; i++)
          if (i < _photos.length)
            Stack(fit: StackFit.expand, children: [
              ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.network(_photos[i]['url'] as String, fit: BoxFit.cover)),
              Positioned(
                right: 4,
                top: 4,
                child: IconButton.filledTonal(
                  tooltip: l.cancel,
                  iconSize: 18,
                  onPressed: () => _remove(_photos[i]['id'] as String),
                  icon: const Icon(Icons.close),
                ),
              ),
            ])
          else
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: _uploading ? null : _pickSource,
              child: DecoratedBox(
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).colorScheme.outlineVariant, width: 1.5)),
                child: Center(child: _uploading && i == _photos.length ? const CircularProgressIndicator() : Icon(Icons.add_a_photo_outlined, semanticLabel: l.addPhoto)),
              ),
            ),
      ],
    );
    if (!widget.onboarding) {
      return Scaffold(appBar: AppBar(title: Text(l.photosTitle)), body: FocusColumn(child: ListView(children: [const SizedBox(height: 8), Text(l.photosHint), const SizedBox(height: 16), grid])));
    }
    return StepScaffold(
      step: 6,
      title: l.photosTitle,
      subtitle: l.photosHint,
      action: BusyButton(label: l.continueBtn, onPressed: _photos.length < 2 ? null : () async => ref.read(sessionProvider.notifier).reloadMe()),
      children: [grid],
    );
  }
}

class InterestsScreen extends ConsumerStatefulWidget {
  const InterestsScreen({super.key, required this.onboarding});
  final bool onboarding;

  @override
  ConsumerState<InterestsScreen> createState() => _InterestsScreenState();
}

class _InterestsScreenState extends ConsumerState<InterestsScreen> {
  List<Map<String, dynamic>> _all = [];
  final Set<String> _picked = {};
  final _bio = TextEditingController();

  @override
  void initState() {
    super.initState();
    () async {
      final api = ref.read(apiProvider);
      final all = (await api.get<List<dynamic>>('/v1/interests')).cast<Map<String, dynamic>>();
      final own = await api.get<Map<String, dynamic>>('/v1/me/profile');
      final p = own['profile'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _all = all;
        _picked.addAll(((p?['interests'] as List?) ?? []).cast<String>());
        _bio.text = (p?['bio'] as String?) ?? '';
      });
    }();
  }

  Future<void> _save() async {
    await ref.read(apiProvider).patch('/v1/me/profile', {'interests': _picked.toList(), 'bio': _bio.text.trim()});
    await ref.read(sessionProvider.notifier).reloadMe();
    if (!widget.onboarding && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final ok = _picked.length >= 3 && _picked.length <= 10;
    final children = [
      Text(l.interestsCount(_picked.length)),
      const SizedBox(height: 12),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final i in _all)
          FilterChip(
            label: Text(i['label'] as String),
            selected: _picked.contains(i['id']),
            onSelected: (s) => setState(() {
              if (s && _picked.length < 10) _picked.add(i['id'] as String);
              if (!s) _picked.remove(i['id']);
            }),
          ),
      ]),
      const SizedBox(height: 24),
      TextField(controller: _bio, maxLength: 300, maxLines: 4, decoration: InputDecoration(labelText: l.bio, helperText: l.bioHint)),
    ];
    if (!widget.onboarding) {
      return Scaffold(
        appBar: AppBar(title: Text(l.interestsTitle)),
        body: FocusColumn(child: ListView(children: [...children, const SizedBox(height: 16), BusyButton(label: l.save, onPressed: ok ? _save : null)])),
      );
    }
    return StepScaffold(step: 7, title: l.interestsTitle, action: BusyButton(label: l.continueBtn, onPressed: ok ? _save : null), children: children);
  }
}

class DiscoveryOptInScreen extends ConsumerWidget {
  const DiscoveryOptInScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    Future<void> finish(bool discover) async {
      final api = ref.read(apiProvider);
      await api.post('/v1/me/onboarding/complete');
      if (discover) await api.patch('/v1/me', {'discoveryEnabled': true});
      await ref.read(sessionProvider.notifier).reloadMe();
    }

    return StepScaffold(
      step: 8,
      title: l.discoveryTitle,
      subtitle: l.discoveryBody,
      children: [
        Icon(Icons.visibility_outlined, size: 96, color: Theme.of(context).colorScheme.secondary),
        const SizedBox(height: 32),
        BusyButton(label: l.discoveryOn, onPressed: () => finish(true)),
        const SizedBox(height: 8),
        BusyButton(label: l.notNow, outlined: true, onPressed: () => finish(false)),
      ],
    );
  }
}
