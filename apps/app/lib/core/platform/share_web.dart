import 'dart:js_interop';
import 'dart:typed_data';

/// Bridge to web/image.js (nearsoulShare): share sheet on phones, download / clipboard elsewhere.
@JS('nearsoulShare')
external _NearSoulShare? get _share;

extension type _NearSoulShare._(JSObject _) implements JSObject {
  external JSPromise<JSString> image(JSUint8Array bytes, String filename, String text);
  external JSPromise<JSString> link(String text, String url);
}

/// Returns 'shared', 'downloaded', 'copied', 'cancelled' or 'failed'.
Future<String> shareImage(Uint8List bytes, String filename, String text) async {
  final s = _share;
  if (s == null) return 'failed';
  return (await s.image(bytes.toJS, filename, text).toDart).toDart;
}

Future<String> shareLink(String text, String url) async {
  final s = _share;
  if (s == null) return 'failed';
  return (await s.link(text, url).toDart).toDart;
}
