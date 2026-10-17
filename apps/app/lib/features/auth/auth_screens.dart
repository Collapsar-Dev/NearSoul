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
              Icon(Icons.favorite, color: scheme.primary),
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
            SizedBox(width: double.infinity, child: FilledButton(onPressed: () => context.push('/auth/email'), child: Text(l.getStarted))),
            const SizedBox(height: 8),
            TextButton(onPressed: () => context.push('/auth/email'), child: Text(l.haveAccount)),
            const SizedBox(height: 16),
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
