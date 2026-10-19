import 'package:flutter/services.dart';

/// Native builds: copy the link (a native share sheet plugin can replace this later).
Future<String> shareImage(Uint8List bytes, String filename, String text) async => 'failed';

Future<String> shareLink(String text, String url) async {
  await Clipboard.setData(ClipboardData(text: '$text $url'));
  return 'copied';
}
