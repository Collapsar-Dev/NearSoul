import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api.dart';
import '../../core/config.dart';
import '../../core/push.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/theme.dart';
import '../../core/widgets/common.dart';
import '../onboarding/onboarding_screens.dart';
import '../shell.dart';

/// S36 Me.
class MeScreen extends ConsumerStatefulWidget {
  const MeScreen({super.key});

  @override
  ConsumerState<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends ConsumerState<MeScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/me/profile');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final me = ref.watch(sessionProvider).me;
    final sections = <(String, List<(IconData, String, String)>)>[
      (l.menuProfile, [
        (Icons.switch_account_outlined, me?.personaLabel == null ? l.profiles : '${l.profiles} · ${me!.personaLabel}', '/me/profiles'),
        (Icons.edit_outlined, l.editProfile, '/me/edit'),
        (Icons.photo_library_outlined, l.menuPhotos, '/me/photos'),
        (me?.verified == true ? Icons.verified : Icons.verified_outlined, me?.verified == true ? l.verifyDone : l.verifyMenu, '/me/verify'),
        (Icons.interests_outlined, l.menuInterests, '/me/interests'),
      ]),
      (l.menuAccount, [
        (Icons.workspace_premium_outlined, l.subscription, '/me/subscription'),
        (Icons.settings_outlined, l.settings, '/me/settings'),
        (Icons.notifications_none, l.notifications, '/me/notifications'),
        (Icons.block, l.blockedUsers, '/me/blocked'),
      ]),
      (l.menuHelp, [
        (Icons.shield_outlined, l.safetyCentre, '/me/safety'),
        if (AppConfig.isAlpha || AppConfig.appEnv == 'development') (Icons.card_giftcard, l.invites, '/me/invites'),
        (Icons.rate_review_outlined, l.sendFeedback, '/me/feedback'),
        if (me?.isTester == true && AppConfig.showTestTools) (Icons.science_outlined, l.alphaTools, '/me/alpha'),
        (Icons.info_outline, l.about, '/me/about'),
      ]),
    ];
    return Scaffold(
      appBar: AppBar(title: NsTitle(l.meTitle)),
      body: FocusColumn(
        maxWidth: 640,
        child: ListView(children: [
          AsyncBody<Map<String, dynamic>>(
            future: _f,
            onRetry: () => setState(() => _f = ref.read(apiProvider).get('/v1/me/profile')),
            builder: (context, data) {
              final p = data['profile'] as Map<String, dynamic>?;
              final photos = (data['photos'] as List).cast<Map<String, dynamic>>();
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(children: [
                  CircleAvatar(radius: 40, backgroundImage: photos.isNotEmpty ? NetworkImage(photos.first['url'] as String) : null),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Flexible(child: Text('${p?['firstName'] ?? ''}${me?.age != null ? ', ${me!.age}' : ''}', style: Theme.of(context).textTheme.headlineSmall)),
                        if (me?.verified == true) ...[const SizedBox(width: 6), const VerifiedBadge()],
                      ]),
                      if (me?.settings['discoveryEnabled'] == false) Text(l.discoverySetting, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      const SizedBox(height: 6),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(minimumSize: const Size(0, 36), visualDensity: VisualDensity.compact),
                        onPressed: () => context.push('/me/profiles'),
                        icon: const Icon(Icons.switch_account_outlined, size: 18),
                        label: Text(me?.personaLabel ?? l.switchOrAdd),
                      ),
                    ]),
                  ),
                ]),
              );
            },
          ),
          for (final (title, items) in sections) ...[
            Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 4), child: Text(title, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Theme.of(context).colorScheme.primary))),
            for (final t in items)
              ListTile(
                leading: Icon(t.$1),
                title: Text(t.$2),
                subtitle: t.$3 == '/me/profiles' ? Text(l.profilesSubtitle) : t.$3 == '/me/verify' && me?.verified != true ? Text(l.verifyMenuSub) : null,
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push(t.$3),
              ),
          ],
          const Divider(),
          ListTile(leading: const Icon(Icons.logout), title: Text(l.logout), onTap: () => ref.read(sessionProvider.notifier).signOut()),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }
}

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _name = TextEditingController();
  final _job = TextEditingController();
  String? _intent;
  final Set<String> _interested = {};
  RangeValues _ages = const RangeValues(18, 40);
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/profile').then((d) {
      final p = d['profile'] as Map<String, dynamic>;
      setState(() {
        _name.text = p['firstName'] as String;
        _job.text = (p['jobTitle'] as String?) ?? '';
        _intent = p['intent'] as String;
        _interested.addAll((p['interestedIn'] as List).cast<String>());
        _ages = RangeValues((p['ageMin'] as int).toDouble(), (p['ageMax'] as int).toDouble());
        _loaded = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final intents = [('long_term', l.intentLong), ('open_to_long', l.intentOpen), ('casual', l.intentCasual), ('not_sure', l.intentNotSure)];
    final interested = [('woman', l.women), ('man', l.men), ('non_binary', l.nonBinaryPeople)];
    return Scaffold(
      appBar: AppBar(title: Text(l.editProfile)),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : FocusColumn(
              child: ListView(children: [
                TextField(controller: _name, maxLength: 30, decoration: InputDecoration(labelText: l.firstName)),
                TextField(controller: _job, maxLength: 40, decoration: const InputDecoration(labelText: 'Job title')),
                SectionTitle(l.interestedIn),
                Wrap(spacing: 8, children: [
                  for (final g in interested) FilterChip(label: Text(g.$2), selected: _interested.contains(g.$1), onSelected: (s) => setState(() => s ? _interested.add(g.$1) : _interested.remove(g.$1))),
                ]),
                SectionTitle(l.lookingFor),
                Wrap(spacing: 8, runSpacing: 8, children: [for (final i in intents) ChoiceChip(label: Text(i.$2), selected: _intent == i.$1, onSelected: (_) => setState(() => _intent = i.$1))]),
                SectionTitle(l.ageRange(_ages.start.round(), _ages.end.round())),
                RangeSlider(values: _ages, min: 18, max: 99, divisions: 81, onChanged: (v) => setState(() => _ages = v)),
                const SizedBox(height: 16),
                BusyButton(
                  label: l.save,
                  onPressed: _interested.isEmpty
                      ? null
                      : () async {
                          await ref.read(apiProvider).patch('/v1/me/profile', {
                            'firstName': _name.text.trim(),
                            'jobTitle': _job.text.trim().isEmpty ? null : _job.text.trim(),
                            'intent': _intent,
                            'interestedIn': _interested.toList(),
                            'ageMin': _ages.start.round(),
                            'ageMax': _ages.end.round(),
                          });
                          if (context.mounted) context.pop();
                        },
                ),
              ]),
            ),
    );
  }
}

/// Push notifications on/off for this device (NOTIF-001).
class PushTile extends ConsumerStatefulWidget {
  const PushTile({super.key});

  @override
  ConsumerState<PushTile> createState() => _PushTileState();
}

class _PushTileState extends ConsumerState<PushTile> {
  late PushState _state = ref.read(pushProvider).state();
  bool _busy = false;

  Future<void> _toggle(bool on) async {
    final push = ref.read(pushProvider);
    setState(() => _busy = true);
    try {
      if (on) {
        final s = await push.enable();
        if (mounted && s == PushState.on) showSnack(context, context.l.pushEnabled);
      } else {
        await push.disable();
      }
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _state = on ? push.state() : PushState.off;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final hint = switch (_state) {
      PushState.on => l.pushOnHint,
      PushState.off => l.pushOffHint,
      PushState.blocked => l.pushBlocked,
      PushState.unsupported => l.pushUnsupported,
    };
    final available = _state == PushState.on || _state == PushState.off;
    return SwitchListTile(
      secondary: const Icon(Icons.notifications_outlined),
      title: Text(l.pushNotifications),
      subtitle: Text(hint),
      value: _state == PushState.on,
      onChanged: available && !_busy ? _toggle : null,
    );
  }
}

/// Theme mode (system / light / dark) and colour palette, stored on this device.
class AppearanceTiles extends ConsumerWidget {
  const AppearanceTiles({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    final look = ref.watch(appearanceProvider);
    final n = ref.read(appearanceProvider.notifier);
    final names = {NsPalette.neutral: l.paletteNeutral, NsPalette.sage: l.paletteSage, NsPalette.sand: l.paletteSand, NsPalette.coral: l.paletteCoral};
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      ListTile(
        leading: const Icon(Icons.palette_outlined),
        title: Text(l.appearance),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: SegmentedButton<ThemeMode>(
            segments: [
              ButtonSegment(value: ThemeMode.system, label: Text(l.themeSystem)),
              ButtonSegment(value: ThemeMode.light, label: Text(l.themeLight)),
              ButtonSegment(value: ThemeMode.dark, label: Text(l.themeDark)),
            ],
            selected: {look.mode},
            onSelectionChanged: (v) => n.setMode(v.first),
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(72, 0, 16, 4),
        child: Text(l.appLogo, style: Theme.of(context).textTheme.labelLarge),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(72, 4, 16, 12),
        child: Wrap(spacing: 12, runSpacing: 8, children: [
          for (final (v, name) in [(NsLogoVariant.soul, l.logoSoul), (NsLogoVariant.pair, l.logoPair), (NsLogoVariant.heart, l.logoHeart)])
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => n.setLogo(v),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: look.logo == v ? Theme.of(context).colorScheme.primary : Colors.transparent, width: 2),
                ),
                child: Column(children: [
                  Image.asset(v.asset, width: 52, height: 52),
                  const SizedBox(height: 4),
                  Text(name, style: Theme.of(context).textTheme.bodySmall),
                ]),
              ),
            ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(72, 0, 16, 12),
        child: Wrap(spacing: 8, runSpacing: 8, children: [
          for (final p in NsPalette.values)
            ChoiceChip(
              avatar: CircleAvatar(backgroundColor: p.primary, radius: 8),
              label: Text(names[p]!),
              selected: look.palette == p,
              onSelected: (_) => n.setPalette(p),
            ),
        ]),
      ),
    ]);
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    final me = ref.watch(sessionProvider).me!;
    final s = me.settings;
    Future<void> update(Map<String, dynamic> body) async {
      try {
        await ref.read(apiProvider).patch('/v1/me', body);
        await ref.read(sessionProvider.notifier).reloadMe();
      } catch (e) {
        if (context.mounted) showSnack(context, errorText(context, e));
      }
    }

    final locale = Localizations.localeOf(context).languageCode;
    return Scaffold(
      appBar: AppBar(title: Text(l.settings)),
      body: FocusColumn(
        child: ListView(children: [
          const PushTile(),
          ExpansionTile(
            leading: const Icon(Icons.tune),
            title: Text(l.notifyTypes),
            children: [
              for (final (key, label) in [
                ('new_match', l.notifyNewMatch),
                ('new_message', l.notifyNewMessage),
                ('daily_set_ready', l.notifyDailySet),
                ('nearby_alert', l.notifyNearby),
                ('open_ending', l.notifyOpenEnding),
                ('report_update', l.notifyReport),
              ])
                SwitchListTile(
                  dense: true,
                  title: Text(label),
                  value: (s['notifications'] as Map?)?[key] != false,
                  onChanged: (v) => update({'notifications': {key: v}}),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: Text(l.notifyRulesNote, style: Theme.of(context).textTheme.bodySmall),
              ),
            ],
          ),
          SwitchListTile(title: Text(l.discoverySetting), value: s['discoveryEnabled'] == true, onChanged: (v) => update({'discoveryEnabled': v})),
          SwitchListTile(title: Text(l.hideDistance), value: s['hideDistance'] == true, onChanged: (v) => update({'hideDistance': v})),
          SwitchListTile(title: Text(l.readReceipts), value: s['readReceipts'] == true, onChanged: (v) => update({'readReceipts': v})),
          ListTile(
            title: Text(l.cardVisibility),
            trailing: DropdownButton<String>(
              value: s['cardVisibility'] as String,
              onChanged: (v) => update({'cardVisibility': v}),
              items: [
                DropdownMenuItem(value: 'everyone', child: Text(l.visibilityEveryone)),
                DropdownMenuItem(value: 'matches_only', child: Text(l.visibilityMatches)),
                DropdownMenuItem(value: 'hidden', child: Text(l.visibilityHidden)),
              ],
            ),
          ),
          ListTile(
            title: Text(l.shareLevel),
            subtitle: Text(switch (s['shareLevel']) {'minimal' => l.shareMinimal, 'standard' => l.shareStandard, 'deep' => l.shareDeep, _ => '-'}),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ShareLevelScreen(inSettings: true))),
          ),
          const AppearanceTiles(),
          ListTile(
            title: Text(l.language),
            trailing: SegmentedButton<String>(
              segments: const [ButtonSegment(value: 'en', label: Text('EN')), ButtonSegment(value: 'ru', label: Text('RU'))],
              selected: {locale == 'ru' ? 'ru' : 'en'},
              onSelectionChanged: (v) {
                ref.read(localeProvider.notifier).set(v.first);
                update({'locale': v.first});
              },
            ),
          ),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: Text(l.exportData),
            onTap: () async {
              final api = ref.read(apiProvider);
              try {
                final s = await api.get<Map<String, dynamic>>('/v1/me/export');
                if (s['status'] == 'ready' && s['url'] != null) {
                  await launchUrl(Uri.parse(s['url'] as String));
                  return;
                }
                if (s['status'] == 'pending') {
                  if (context.mounted) showSnack(context, l.exportPending);
                  return;
                }
              } on ApiError catch (e) {
                if (e.status != 404) rethrow;
              }
              try {
                await api.post('/v1/me/export');
                if (context.mounted) showSnack(context, l.exportRequested);
              } catch (e) {
                if (context.mounted) showSnack(context, errorText(context, e));
              }
            },
          ),
          const Divider(height: 32),
          ListTile(leading: const Icon(Icons.logout), title: Text(l.logout), onTap: () => ref.read(sessionProvider.notifier).signOut()),
          ListTile(
            leading: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error),
            title: Text(l.deleteAccount, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            onTap: () => context.push('/me/delete'),
          ),
        ]),
      ),
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/notifications');

  String _text(BuildContext context, Map<String, dynamic> n) {
    final l = context.l;
    return switch (n['type']) {
      'new_match' => l.itsMatch,
      'new_message' => l.typeMessage,
      'nearby_alert' => '${l.tabNearby} ✨ ${(n['payload'] as Map)['band'] ?? ''}',
      'daily_set_ready' => l.todayTitle,
      'open_ending' => l.nearbyOffTitle,
      'soul_check' => l.checkNotif,
      'verification_result' => (n['payload'] as Map)['status'] == 'approved' ? l.verifyApproved : l.verifyRejected,
      _ => l.notifications,
    };
  }

  void _open(Map<String, dynamic> n) {
    final p = (n['payload'] as Map).cast<String, dynamic>();
    switch (n['type']) {
      case 'new_match':
      case 'new_message':
        context.go('/matches/${p['matchId']}');
      case 'nearby_alert':
      case 'open_ending':
        context.go('/nearby');
      case 'verification_result':
        context.go('/me/verify');
      case 'soul_check':
        context.go('/soul');
      default:
        context.go('/today');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.notifications), actions: [
        TextButton(
          onPressed: () async {
            await ref.read(apiProvider).post('/v1/notifications/read-all');
            setState(() => _f = ref.read(apiProvider).get('/v1/notifications'));
          },
          child: Text(l.markAllRead),
        ),
      ]),
      body: AsyncBody<Map<String, dynamic>>(
        future: _f,
        builder: (context, d) {
          final items = (d['items'] as List).cast<Map<String, dynamic>>();
          if (items.isEmpty) return EmptyState(icon: Icons.notifications_none, text: l.noNotifications);
          return FocusColumn(
            child: ListView(children: [
              for (final n in items)
                ListTile(
                  leading: Icon(n['read'] == true ? Icons.circle_outlined : Icons.circle, size: 12, color: Theme.of(context).colorScheme.primary),
                  title: Text(_text(context, n)),
                  subtitle: Text(DateFormat.yMMMd().add_Hm().format(DateTime.parse(n['createdAt'] as String).toLocal())),
                  onTap: () => _open(n),
                ),
            ]),
          );
        },
      ),
    );
  }
}

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen> {
  String _cat = 'bug';
  final _text = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final cats = [('bug', l.fbBug), ('idea', l.fbIdea), ('confusing', l.fbConfusing), ('engine_wrong', l.fbEngine), ('other', l.fbOther)];
    return Scaffold(
      appBar: AppBar(title: Text(l.feedbackTitle)),
      body: FocusColumn(
        child: ListView(children: [
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [for (final c in cats) ChoiceChip(label: Text(c.$2), selected: _cat == c.$1, onSelected: (_) => setState(() => _cat = c.$1))]),
          const SizedBox(height: 16),
          TextField(controller: _text, maxLines: 6, maxLength: 2000, decoration: InputDecoration(labelText: l.sendFeedback)),
          BusyButton(
            label: l.send,
            onPressed: () async {
              if (_text.text.trim().length < 2) return;
              await ref.read(apiProvider).post('/v1/feedback', {
                'category': _cat,
                'text': _text.text.trim(),
                'appVersion': '${AppConfig.version}+${AppConfig.build}',
                'platform': Theme.of(context).platform.name,
                'screen': GoRouterState.of(context).uri.path,
              });
              if (!context.mounted) return;
              showSnack(context, l.feedbackSent);
              context.pop();
            },
          ),
        ]),
      ),
    );
  }
}

class InvitesScreen extends ConsumerStatefulWidget {
  const InvitesScreen({super.key});

  @override
  ConsumerState<InvitesScreen> createState() => _InvitesScreenState();
}

class _InvitesScreenState extends ConsumerState<InvitesScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/me/invites');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    String link(String code) => '${Uri.base.origin}/invite/$code';
    return Scaffold(
      appBar: AppBar(title: Text(l.invites)),
      body: AsyncBody<Map<String, dynamic>>(
        future: _f,
        builder: (context, d) => FocusColumn(
          child: ListView(children: [
            const SizedBox(height: 8),
            Text(l.invitesLeft(d['invitesLeft'] as int), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            BusyButton(
              label: l.createInvite,
              onPressed: (d['invitesLeft'] as int) <= 0
                  ? null
                  : () async {
                      await ref.read(apiProvider).post('/v1/me/invites');
                      setState(() => _f = ref.read(apiProvider).get('/v1/me/invites'));
                    },
            ),
            const SizedBox(height: 16),
            for (final i in (d['invites'] as List).cast<Map<String, dynamic>>())
              ListTile(
                title: Text(i['code'] as String, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600)),
                subtitle: Text('${i['uses']}/${i['maxUses']}'),
                trailing: IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: link(i['code'] as String)));
                    showSnack(context, l.copied);
                  },
                ),
              ),
          ]),
        ),
      ),
    );
  }
}

class AlphaToolsScreen extends ConsumerStatefulWidget {
  const AlphaToolsScreen({super.key});

  @override
  ConsumerState<AlphaToolsScreen> createState() => _AlphaToolsScreenState();
}

class _AlphaToolsScreenState extends ConsumerState<AlphaToolsScreen> {
  late final Future<List<dynamic>> _presets = ref.read(apiProvider).get('/v1/alpha/presets');
  Map<String, dynamic>? _debug;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.alphaTools)),
      body: FocusColumn(
        child: ListView(children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
            child: const Text('TEST TOOLS — alpha only', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          SectionTitle(l.simulateLocation),
          AsyncBody<List<dynamic>>(
            future: _presets,
            builder: (context, presets) => Wrap(spacing: 8, runSpacing: 8, children: [
              for (final p in presets.cast<Map<String, dynamic>>())
                ActionChip(
                  label: Text(p['name'] as String),
                  onPressed: () async {
                    try {
                      await ref.read(apiProvider).post('/v1/alpha/location', {'presetId': p['id']});
                      if (context.mounted) showSnack(context, '${l.simulated}: ${p['name']}');
                    } catch (e) {
                      if (context.mounted) showSnack(context, errorText(context, e));
                    }
                  },
                ),
            ]),
          ),
          SectionTitle(l.resetToday),
          BusyButton(label: l.resetToday, outlined: true, onPressed: () async {
            await ref.read(apiProvider).post('/v1/alpha/daily-set/reset');
            if (context.mounted) showSnack(context, l.done);
          }),
          SectionTitle(l.engineDebug),
          BusyButton(label: l.engineDebug, outlined: true, onPressed: () async {
            final d = await ref.read(apiProvider).get<Map<String, dynamic>>('/v1/alpha/engine-debug/me');
            setState(() => _debug = d);
          }),
          if (_debug != null) ...[
            const SizedBox(height: 12),
            SelectableText(
              '${(_debug!['domains'] as Map).entries.map((e) => '${e.key}: ${(e.value as Map)['score']} (${(e.value as Map)['band']}, conf ${(e.value as Map)['confidence']})').join('\n')}'
              '\narchetype: ${_debug!['archetype']} · depth ${_debug!['depth']} · engine ${_debug!['engineVersion']}',
              style: const TextStyle(fontFamily: 'monospace'),
            ),
          ],
          const SizedBox(height: 32),
        ]),
      ),
    );
  }
}

class BlockedUsersScreen extends ConsumerStatefulWidget {
  const BlockedUsersScreen({super.key});

  @override
  ConsumerState<BlockedUsersScreen> createState() => _BlockedUsersScreenState();
}

class _BlockedUsersScreenState extends ConsumerState<BlockedUsersScreen> {
  late Future<List<dynamic>> _f = ref.read(apiProvider).get('/v1/blocks');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.blockedUsers)),
      body: AsyncBody<List<dynamic>>(
        future: _f,
        builder: (context, rows) => rows.isEmpty
            ? EmptyState(icon: Icons.block, text: l.noNotifications)
            : ListView(children: [
                for (final r in rows.cast<Map<String, dynamic>>())
                  ListTile(
                    title: Text((r['firstName'] as String?) ?? '—'),
                    trailing: TextButton(
                      onPressed: () async {
                        await ref.read(apiProvider).delete('/v1/blocks/${r['userId']}');
                        setState(() => _f = ref.read(apiProvider).get('/v1/blocks'));
                      },
                      child: Text(l.unblock),
                    ),
                  ),
              ]),
      ),
    );
  }
}

class SafetyCentreScreen extends StatelessWidget {
  const SafetyCentreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.safetyCentre)),
      body: FocusColumn(
        child: ListView(children: [
          for (final t in [l.safety1, l.safety2, l.safety3, l.safety4, l.safety5]) ListTile(leading: const Icon(Icons.shield_outlined), title: Text(t)),
          const SizedBox(height: 12),
          Card(color: Theme.of(context).colorScheme.errorContainer, child: ListTile(leading: const Icon(Icons.emergency), title: Text(l.emergency))),
        ]),
      ),
    );
  }
}

class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.about)),
      body: FocusColumn(
        child: ListView(children: [
          const SizedBox(height: 16),
          Text('NearSoul', style: Theme.of(context).textTheme.headlineSmall),
          Text(l.tagline),
          const SizedBox(height: 16),
          Text(l.version('${AppConfig.version}+${AppConfig.build}')),
          Text(l.environment(AppConfig.appEnv)),
          const SizedBox(height: 16),
          Text(l.ipipNote, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          TextButton(onPressed: () => showLicensePage(context: context, applicationName: 'NearSoul'), child: const Text('Licenses')),
        ]),
      ),
    );
  }
}

class DeleteAccountScreen extends ConsumerWidget {
  const DeleteAccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.deleteAccount)),
      body: FocusColumn(
        child: ListView(children: [
          const SizedBox(height: 16),
          Text(l.deleteBody, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 24),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(content: Text(l.deleteBody), actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.cancel)),
                  FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.deleteConfirm)),
                ]),
              );
              if (ok != true) return;
              final api = ref.read(apiProvider);
              String? testCode;
              try {
                final res = await api.post<Map<String, dynamic>>('/v1/me/sensitive-code');
                testCode = res['testCode'] as String?;
              } catch (e) {
                if (context.mounted) showSnack(context, errorText(context, e));
              }
              if (!context.mounted) return;
              final codeCtl = TextEditingController(text: testCode);
              final code = await showDialog<String>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: Text(l.codeTitle),
                  content: Column(mainAxisSize: MainAxisSize.min, children: [
                    if (testCode != null) Text(l.testCodeBanner(testCode)),
                    TextField(controller: codeCtl, keyboardType: TextInputType.number, maxLength: 6, decoration: InputDecoration(labelText: l.codeLabel)),
                  ]),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l.cancel)),
                    FilledButton(onPressed: () => Navigator.pop(ctx, codeCtl.text.trim()), child: Text(l.deleteConfirm)),
                  ],
                ),
              );
              if (code == null || code.isEmpty) return;
              try {
                await api.post('/v1/me/delete', {'code': code});
              } catch (e) {
                if (context.mounted) showSnack(context, errorText(context, e));
                return;
              }
              await api.clear();
              ref.invalidate(sessionProvider);
            },
            child: Text(l.deleteConfirm),
          ),
        ]),
      ),
    );
  }
}
