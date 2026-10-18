import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/responsive.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';
import '../matches/safety_actions.dart';
import 'profile_widgets.dart';

/// S15 candidate / match profile.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key, required this.userId, this.withActions = false});
  final String userId;

  /// Opened from Today's card: show pass/like here; the choice goes back to Today, which sends it.
  final bool withActions;

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late Future<Map<String, dynamic>> _f = ref.read(apiProvider).get('/v1/profiles/${widget.userId}');

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(),
        bottomNavigationBar: widget.withActions
            ? SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: LikePassBar(onLike: () async => context.pop('like'), onPass: () async => context.pop('pass')),
                ),
              )
            : null,
        body: AsyncBody<Map<String, dynamic>>(
          future: _f,
          onRetry: () => setState(() => _f = ref.read(apiProvider).get('/v1/profiles/${widget.userId}')),
          builder: (context, p) => ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 32), children: [
            FocusColumn(
              padding: EdgeInsets.zero,
              child: ProfileDetails(
                p: p,
                onReport: () => reportFlow(context, ref, userId: widget.userId, name: p['firstName'] as String, onDone: () => context.pop()),
                onBlock: () => blockFlow(context, ref, userId: widget.userId, name: p['firstName'] as String, onDone: () => context.pop()),
              ),
            ),
          ]),
        ),
      );
}
