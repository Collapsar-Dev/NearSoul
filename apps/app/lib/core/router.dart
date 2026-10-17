import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/auth_screens.dart';
import '../features/auth/download_screen.dart';
import '../features/matches/matches_screen.dart';
import '../features/matches/pair_report_screen.dart';
import '../features/me/me_screens.dart';
import '../features/me/personas_screen.dart';
import '../features/nearby/nearby_screen.dart';
import '../features/onboarding/onboarding_screens.dart';
import '../features/onboarding/quick_scan_screen.dart';
import '../features/onboarding/reveal_screen.dart';
import '../features/shell.dart';
import '../features/soul/soul_screens.dart';
import '../features/today/profile_screen.dart';
import '../features/today/today_screen.dart';
import 'session.dart';

/// Pending invite code from an /invite/{code} link (ALPHA-001).
class InviteCode extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? code) => state = code;
}

final inviteCodeProvider = NotifierProvider<InviteCode, String?>(InviteCode.new);

/// The next onboarding route for a signed-in user (null when onboarding is done).
String? onboardingRoute(Me me) {
  if (me.status == 'blocked_underage') return '/blocked';
  if (me.isActive) return null;
  final o = me.onboarding;
  if (o['dob'] != true) return '/onboarding/dob';
  if (o['terms'] != true) return '/onboarding/consents';
  if (o['quickScan'] != true) return '/onboarding/scan';
  if (o['cardReviewed'] != true) return '/onboarding/reveal';
  if (o['shareLevel'] != true) return '/onboarding/share';
  if (o['basics'] != true) return '/onboarding/basics';
  if (o['photos'] != true) return '/onboarding/photos';
  if (o['interests'] != true) return '/onboarding/interests';
  return '/onboarding/discovery';
}

class _SessionListenable extends ChangeNotifier {
  _SessionListenable(Ref ref) {
    ref.listen(sessionProvider, (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final listenable = _SessionListenable(ref);
  const publicPaths = ['/welcome', '/auth/email', '/auth/code'];
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: listenable,
    redirect: (context, state) {
      final session = ref.read(sessionProvider);
      final path = state.uri.path;
      if (path.startsWith('/invite/') || path == '/download') return null;
      // Keep the original deep link while the session loads, then return to it (PLAT-003).
      if (session.phase == Phase.loading) return path == '/splash' ? null : '/splash?from=${Uri.encodeComponent(state.uri.toString())}';
      final from = path == '/splash' ? state.uri.queryParameters['from'] : null;
      if (session.phase == Phase.signedOut) {
        if (from != null && publicPaths.contains(Uri.parse(from).path)) return from;
        return publicPaths.contains(path) ? null : '/welcome';
      }
      final me = session.me!;
      final next = onboardingRoute(me);
      // An unfinished extra profile can still open the profile switcher to go back (CR-17).
      if (next != null) return path == next || (path == '/me/profiles' && me.isPersona) ? null : next;
      if (from != null && !publicPaths.contains(Uri.parse(from).path) && !from.startsWith('/onboarding') && from != '/splash') return from;
      if (path == '/splash' || publicPaths.contains(path) || path.startsWith('/onboarding') || path == '/blocked') return '/today';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/download', builder: (_, _) => const DownloadScreen()),
      GoRoute(path: '/auth/email', builder: (_, _) => const EmailScreen()),
      GoRoute(path: '/auth/code', builder: (_, s) => CodeScreen(email: s.uri.queryParameters['email'] ?? '')),
      GoRoute(path: '/invite/:code', builder: (_, s) => InviteLandingScreen(code: s.pathParameters['code']!)),
      GoRoute(path: '/blocked', builder: (_, _) => const BlockedScreen()),
      GoRoute(path: '/onboarding/dob', builder: (_, _) => const DobScreen()),
      GoRoute(path: '/onboarding/consents', builder: (_, _) => const ConsentsScreen()),
      GoRoute(path: '/onboarding/scan', builder: (_, _) => const QuickScanScreen()),
      GoRoute(path: '/onboarding/reveal', builder: (_, _) => const RevealScreen()),
      GoRoute(path: '/onboarding/share', builder: (_, _) => const ShareLevelScreen()),
      GoRoute(path: '/onboarding/basics', builder: (_, _) => const BasicsScreen()),
      GoRoute(path: '/onboarding/photos', builder: (_, _) => const PhotosScreen(onboarding: true)),
      GoRoute(path: '/onboarding/interests', builder: (_, _) => const InterestsScreen(onboarding: true)),
      GoRoute(path: '/onboarding/discovery', builder: (_, _) => const DiscoveryOptInScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/today', builder: (_, _) => const TodayScreen(), routes: [
              GoRoute(path: 'profile/:id', builder: (_, s) => ProfileScreen(userId: s.pathParameters['id']!)),
            ]),
          ]),
          StatefulShellBranch(routes: [GoRoute(path: '/nearby', builder: (_, _) => const NearbyScreen())]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/soul', builder: (_, _) => const SoulScreen(), routes: [
              GoRoute(path: 'report', builder: (_, _) => const SelfReportScreen()),
            ]),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/matches', builder: (_, _) => const MatchesScreen(), routes: [
              GoRoute(path: ':id', builder: (_, s) => ChatRoute(matchId: s.pathParameters['id']!), routes: [
                GoRoute(path: 'report', builder: (_, s) => PairReportScreen(matchId: s.pathParameters['id']!)),
              ]),
            ]),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/me', builder: (_, _) => const MeScreen(), routes: [
              GoRoute(path: 'edit', builder: (_, _) => const EditProfileScreen()),
              GoRoute(path: 'photos', builder: (_, _) => const PhotosScreen(onboarding: false)),
              GoRoute(path: 'interests', builder: (_, _) => const InterestsScreen(onboarding: false)),
              GoRoute(path: 'settings', builder: (_, _) => const SettingsScreen()),
              GoRoute(path: 'profiles', builder: (_, _) => const PersonasScreen()),
              GoRoute(path: 'notifications', builder: (_, _) => const NotificationsScreen()),
              GoRoute(path: 'feedback', builder: (_, _) => const FeedbackScreen()),
              GoRoute(path: 'invites', builder: (_, _) => const InvitesScreen()),
              GoRoute(path: 'alpha', builder: (_, _) => const AlphaToolsScreen()),
              GoRoute(path: 'blocked', builder: (_, _) => const BlockedUsersScreen()),
              GoRoute(path: 'safety', builder: (_, _) => const SafetyCentreScreen()),
              GoRoute(path: 'about', builder: (_, _) => const AboutScreen()),
              GoRoute(path: 'delete', builder: (_, _) => const DeleteAccountScreen()),
            ]),
          ]),
        ],
      ),
    ],
  );
});
