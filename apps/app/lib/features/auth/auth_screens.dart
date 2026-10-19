import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/responsive.dart';
import '../../core/router.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../../core/platform/social_stub.dart' if (dart.library.js_interop) '../../core/platform/social_web.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.favorite, size: 56, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text('NearSoul', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 24),
            const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2.5)),
          ]),
        ),
      );
}

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _page = PageController();
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final slides = [
      (Icons.auto_awesome, l.welcome1),
      (Icons.radar, l.welcome2),
      (Icons.lock_outline, l.welcome3),
    ];
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: FocusColumn(
          child: Column(children: [
            const SizedBox(height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const NsLogo(size: 32),
              const SizedBox(width: 8),
              Text('NearSoul', style: Theme.of(context).textTheme.headlineSmall),
              const TestBadge(),
            ]),
            Expanded(
              child: PageView(
                controller: _page,
                onPageChanged: (i) => setState(() => _index = i),
                children: [
                  for (final s in slides)
                    Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (s == slides.first)
                        const NsLogo(size: 168)
                      else
                        Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [scheme.primary.withValues(alpha: 0.25), scheme.secondary.withValues(alpha: 0.25)])),
                          child: Icon(s.$1, size: 72, color: scheme.secondary),
                        ),
                      const SizedBox(height: 32),
                      Text(s.$2, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                    ]),
                ],
              ),
            ),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              for (var i = 0; i < slides.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.all(4),
                  width: i == _index ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(color: i == _index ? scheme.primary : scheme.outlineVariant, borderRadius: BorderRadius.circular(8)),
                ),
            ]),
            const SizedBox(height: 24),
            const SocialButtons(),
            const SizedBox(height: 10),
            SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () => context.push('/auth/email'), icon: const Icon(Icons.mail_outline), label: Text(l.continueEmail))),
            TextButton(onPressed: () => context.push('/auth/email'), child: Text(l.haveAccount)),
            const SizedBox(height: 8),
          ]),
        ),
      ),
    );
  }
}

class EmailScreen extends ConsumerStatefulWidget {
  const EmailScreen({super.key});

  @override
  ConsumerState<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends ConsumerState<EmailScreen> {
  final _email = TextEditingController();
  final _form = GlobalKey<FormState>();

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final email = _email.text.trim();
    try {
      await ref.read(sessionProvider.notifier).requestCode(email);
    } on ApiError catch (e) {
      if (e.code != 'RATE_LIMITED') rethrow; // a recent code is still valid: continue to the code screen
    }
    if (mounted) context.push('/auth/code?email=${Uri.encodeComponent(email)}');
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: FocusColumn(
          child: Form(
            key: _form,
            child: ListView(children: [
              Text(l.emailTitle, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(l.emailHint),
              const SizedBox(height: 24),
              TextFormField(
                controller: _email,
                autofocus: true,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: InputDecoration(labelText: l.emailLabel),
                validator: (v) => v != null && RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim()) ? null : l.emailInvalid,
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 24),
              BusyButton(label: l.continueBtn, onPressed: _submit),
              const SizedBox(height: 16),
              Text(l.termsNote, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
            ]),
          ),
        ),
      ),
    );
  }
}

class CodeScreen extends ConsumerStatefulWidget {
  const CodeScreen({super.key, required this.email});
  final String email;

  @override
  ConsumerState<CodeScreen> createState() => _CodeScreenState();
}

class _CodeScreenState extends ConsumerState<CodeScreen> {
  final _code = TextEditingController();
  late final _invite = TextEditingController(text: ref.read(inviteCodeProvider) ?? '');
  bool _needInvite = false;
  int _cooldown = 60;
  Timer? _timer;
  String? _error;

  String? _testCode;

  @override
  void initState() {
    super.initState();
    _startCooldown();
    _showTestCode();
  }

  void _showTestCode() {
    _testCode = ref.read(sessionProvider.notifier).testCodeFor(widget.email);
    if (_testCode != null) _code.text = _testCode!;
  }

  void _startCooldown() {
    _cooldown = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => _cooldown = (_cooldown - 1).clamp(0, 60));
      if (_cooldown == 0) t.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() => _error = null);
    try {
      await ref.read(sessionProvider.notifier).verify(widget.email, _code.text.trim(), inviteCode: _invite.text.trim());
      ref.read(inviteCodeProvider.notifier).set(null);
    } on ApiError catch (e) {
      if (e.code == 'INVITE_REQUIRED' || e.code == 'INVALID_INVITE') {
        setState(() {
          _needInvite = true;
          _error = e.message;
        });
        return;
      }
      setState(() => _error = errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: FocusColumn(
          child: ListView(children: [
            Text(l.codeTitle, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            if (_testCode == null) Text(l.codeSent(widget.email)) else Text(widget.email),
            if (_testCode != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.tertiaryContainer, borderRadius: BorderRadius.circular(12)),
                child: Text(l.testCodeBanner(_testCode!), style: TextStyle(color: Theme.of(context).colorScheme.onTertiaryContainer)),
              ),
            ],
            const SizedBox(height: 24),
            TextField(
              controller: _code,
              autofocus: true,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
              style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
              decoration: InputDecoration(labelText: l.codeLabel),
              onChanged: (v) {
                if (v.length == 6 && !_needInvite) _verify();
              },
            ),
            if (_needInvite) ...[
              const SizedBox(height: 16),
              Text(l.inviteHint),
              const SizedBox(height: 8),
              TextField(controller: _invite, textCapitalization: TextCapitalization.characters, decoration: InputDecoration(labelText: l.inviteLabel)),
            ],
            if (_error != null) ...[const SizedBox(height: 12), Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error))],
            const SizedBox(height: 24),
            BusyButton(label: l.continueBtn, onPressed: _verify),
            const SizedBox(height: 12),
            Center(
              child: _cooldown > 0
                  ? Text(l.resendIn(_cooldown), style: Theme.of(context).textTheme.bodySmall)
                  : TextButton(
                      onPressed: () async {
                        try {
                          await ref.read(sessionProvider.notifier).requestCode(widget.email);
                          _startCooldown();
                          setState(_showTestCode);
                        } catch (e) {
                          if (context.mounted) showSnack(context, errorText(context, e));
                        }
                      },
                      child: Text(l.resend),
                    ),
            ),
            if (_testCode == null) Center(child: Text(l.checkSpam, style: Theme.of(context).textTheme.bodySmall)),
          ]),
        ),
      ),
    );
  }
}

/// /invite/{code}: remember the code and continue to sign-up.
class InviteLandingScreen extends ConsumerStatefulWidget {
  const InviteLandingScreen({super.key, required this.code});
  final String code;

  @override
  ConsumerState<InviteLandingScreen> createState() => _InviteLandingScreenState();
}

class _InviteLandingScreenState extends ConsumerState<InviteLandingScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(inviteCodeProvider.notifier).set(widget.code.toUpperCase());
      if (mounted) context.go(ref.read(sessionProvider).phase == Phase.signedIn ? '/today' : '/welcome');
    });
  }

  @override
  Widget build(BuildContext context) => const SplashScreen();
}

class BlockedScreen extends ConsumerWidget {
  const BlockedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l;
    return Scaffold(
      body: FocusColumn(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.block, size: 56),
          const SizedBox(height: 16),
          Text(l.blockedTitle, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(l.blockedBody, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          OutlinedButton(onPressed: () => ref.read(sessionProvider.notifier).signOut(), child: Text(l.logout)),
        ]),
      ),
    );
  }
}

/// CR-33: Sign in with Apple, Google and VK ID (best practice: Apple shown with equal prominence when other
/// social logins exist). Buttons whose keys aren't configured yet explain that instead of failing.
class SocialButtons extends ConsumerStatefulWidget {
  const SocialButtons({super.key});

  @override
  ConsumerState<SocialButtons> createState() => _SocialButtonsState();
}

class _SocialButtonsState extends ConsumerState<SocialButtons> {
  Map<String, dynamic> _providers = const {};
  String? _busy;

  @override
  void initState() {
    super.initState();
    ref.read(apiProvider).get<Map<String, dynamic>>('/v1/auth/providers').then((p) {
      if (!mounted) return;
      setState(() => _providers = p);
      if (p['apple'] != null) preloadApple();
    }).catchError((_) {});
  }

  Future<void> _go(String provider, String name) async {
    final l = context.l;
    final cfg = _providers[provider] as Map?;
    if (!socialSupported) return showSnack(context, l.socialNative);
    if (cfg == null) return showSnack(context, l.socialSoon(name));
    setState(() => _busy = provider);
    try {
      final payload = await socialAuthorize(provider, cfg['clientId'] as String);
      await ref.read(sessionProvider.notifier).socialSignIn(provider, payload, inviteCode: ref.read(inviteCodeProvider));
    } on ApiError catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } catch (e) {
      final msg = e.toString();
      if (mounted && !msg.contains('cancelled') && !msg.contains('popup_closed')) showSnack(context, msg.contains('popup_blocked') ? l.socialPopupBlocked : l.socialFailed);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Widget _button({required String provider, required String name, required Widget icon, required String label, required Color bg, required Color fg, Color? border}) => SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(backgroundColor: bg, foregroundColor: fg, side: BorderSide(color: border ?? bg), minimumSize: const Size.fromHeight(50)),
          onPressed: _busy != null ? null : () => _go(provider, name),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (_busy == provider) SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: fg)) else icon,
            const SizedBox(width: 10),
            Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Column(children: [
      _button(provider: 'apple', name: 'Apple', icon: Icon(Icons.apple, color: dark ? Colors.black : Colors.white), label: l.socialApple, bg: dark ? Colors.white : Colors.black, fg: dark ? Colors.black : Colors.white),
      const SizedBox(height: 8),
      _button(
        provider: 'google',
        name: 'Google',
        icon: const Text('G', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF4285F4))),
        label: l.socialGoogle,
        bg: Colors.white,
        fg: const Color(0xFF1F1F1F),
        border: const Color(0xFFDADCE0),
      ),
      const SizedBox(height: 8),
      _button(
        provider: 'vk',
        name: 'VK',
        icon: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(5)),
          child: const Text('VK', style: TextStyle(color: Color(0xFF0077FF), fontWeight: FontWeight.w900, fontSize: 13)),
        ),
        label: l.socialVk,
        bg: const Color(0xFF0077FF),
        fg: Colors.white,
      ),
      Padding(
        padding: const EdgeInsets.only(top: 10),
        child: Row(children: [
          const Expanded(child: Divider()),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text(l.or, style: Theme.of(context).textTheme.bodySmall)),
          const Expanded(child: Divider()),
        ]),
      ),
    ]);
  }
}

