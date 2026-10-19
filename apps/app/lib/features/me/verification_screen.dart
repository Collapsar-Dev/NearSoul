import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/platform/image_stub.dart' if (dart.library.js_interop) '../../core/platform/image_web.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// CR-30: copy today's pose in a selfie; a moderator compares it with the profile photos (automatic in the alpha).
class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({super.key});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  late Future<Map<String, dynamic>> _f = _load();
  bool _sending = false;

  Future<Map<String, dynamic>> _load() => ref.read(apiProvider).get<Map<String, dynamic>>('/v1/me/verification');

  (String, String) _pose(BuildContext context, String key) {
    final l = context.l;
    return switch (key) {
      'peace' => ('✌️', l.posePeace),
      'thumb_up' => ('👍', l.poseThumb),
      'three_fingers' => ('🤟', l.poseThree),
      'wave' => ('👋', l.poseWave),
      'touch_ear' => ('👂', l.poseEar),
      _ => ('🤔', l.poseChin),
    };
  }

  Future<void> _take(String pose) async {
    final file = await ImagePicker().pickImage(source: ImageSource.camera, preferredCameraDevice: CameraDevice.front, maxWidth: 1600, imageQuality: 90);
    if (file == null) return;
    setState(() => _sending = true);
    try {
      final original = await file.readAsBytes();
      final jpeg = await toJpeg(original, 1600);
      await ref.read(apiProvider).upload('/v1/me/verification', 'selfie', jpeg ?? original, 'selfie.jpg', fields: {'pose': pose});
      await ref.read(sessionProvider.notifier).reloadMe();
      setState(() => _f = _load());
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(l.verifyTitle)),
      body: FocusColumn(
        maxWidth: 560,
        child: AsyncBody<Map<String, dynamic>>(
          future: _f,
          onRetry: () => setState(() => _f = _load()),
          builder: (context, s) {
            if (s['verified'] == true) {
              return ListView(padding: const EdgeInsets.symmetric(vertical: 32), children: [
                const Center(child: VerifiedBadge(size: 96)),
                const SizedBox(height: 16),
                Text(l.verifyDone, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(l.verifyDoneBody, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                FilledButton(onPressed: () => context.pop(), child: Text(l.done)),
              ]);
            }
            if (s['pending'] == true) {
              return ListView(padding: const EdgeInsets.symmetric(vertical: 32), children: [
                Icon(Icons.hourglass_top, size: 72, color: scheme.primary),
                const SizedBox(height: 16),
                Text(l.verifyPending, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(l.verifyPendingBody, textAlign: TextAlign.center),
              ]);
            }
            final (emoji, text) = _pose(context, s['pose'] as String);
            final last = s['lastResult'] as Map?;
            return ListView(padding: const EdgeInsets.symmetric(vertical: 16), children: [
              Text(l.verifyHeadline, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(l.verifyIntro),
              if (last?['status'] == 'rejected') ...[
                const SizedBox(height: 12),
                Card(color: scheme.errorContainer, child: ListTile(leading: const Icon(Icons.info_outline), title: Text(l.verifyRejected), subtitle: Text(l.verifyTryAgain))),
              ],
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(children: [
                    Text(l.verifyPoseLabel, style: Theme.of(context).textTheme.labelLarge),
                    const SizedBox(height: 8),
                    Text(emoji, style: const TextStyle(fontSize: 72)),
                    const SizedBox(height: 8),
                    Text(text, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                  ]),
                ),
              ),
              const SizedBox(height: 16),
              for (final t in [l.verifyStep1, l.verifyStep2, l.verifyStep3])
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(Icons.check_circle_outline, size: 20, color: scheme.primary),
                    const SizedBox(width: 8),
                    Expanded(child: Text(t)),
                  ]),
                ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _sending ? null : () => _take(s['pose'] as String),
                icon: _sending ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.photo_camera_front_outlined),
                label: Text(l.verifyTake),
              ),
              const SizedBox(height: 12),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.lock_outline, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(l.verifyPrivacy, style: Theme.of(context).textTheme.bodySmall)),
              ]),
              if (s['autoApprove'] == true) ...[
                const SizedBox(height: 8),
                Text(l.verifyAlphaNote, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.tertiary)),
              ],
            ]);
          },
        ),
      ),
    );
  }
}
