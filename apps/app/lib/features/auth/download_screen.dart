import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/responsive.dart';
import '../../core/widgets/common.dart';

/// ALPHA-008: public download page. Links come from build-time defines so CI can point at the latest artifacts.
class DownloadScreen extends StatelessWidget {
  const DownloadScreen({super.key});

  static const apkUrl = String.fromEnvironment('APK_URL');
  static const testflightUrl = String.fromEnvironment('TESTFLIGHT_URL');
  static const desktopUrl = String.fromEnvironment('DESKTOP_URL');

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    Widget tile(IconData icon, String title, String? hint, String url, {VoidCallback? onTap}) => Card(
          child: ListTile(
            leading: Icon(icon, size: 32),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (hint != null) Text(hint),
              if (onTap == null) SelectableText(url.isEmpty ? l.notAvailableYet : url, style: TextStyle(color: Theme.of(context).colorScheme.secondary)),
            ]),
            onTap: onTap,
          ),
        );
    return Scaffold(
      body: SafeArea(
        child: FocusColumn(
          child: ListView(children: [
            const SizedBox(height: 32),
            Row(children: [const NsLogo(size: 28), const SizedBox(width: 8), Text(l.downloadTitle, style: Theme.of(context).textTheme.headlineMedium), const TestBadge()]),
            const SizedBox(height: 8),
            Text(l.tagline),
            const SizedBox(height: 24),
            tile(Icons.language, l.downloadWeb, l.downloadWebHint, '', onTap: () => context.go('/welcome')),
            const SizedBox(height: 12),
            tile(Icons.android, l.downloadAndroid, l.downloadAndroidHint, apkUrl),
            const SizedBox(height: 12),
            tile(Icons.phone_iphone, l.downloadIos, null, testflightUrl),
            const SizedBox(height: 12),
            tile(Icons.desktop_windows_outlined, l.downloadDesktop, l.downloadDesktopHint, desktopUrl),
          ]),
        ),
      ),
    );
  }
}
