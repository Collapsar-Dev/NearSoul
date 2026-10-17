import 'dart:js_interop';
import 'dart:typed_data';

/// Bridge to web/image.js: decode in the browser (HEIC on Safari, huge camera photos) and re-encode as JPEG.
@JS('nearsoulImage')
external _NearSoulImage? get _image;

extension type _NearSoulImage._(JSObject _) implements JSObject {
  external JSPromise<JSUint8Array?> toJpeg(JSUint8Array bytes, int maxSide);
}

Future<List<int>?> toJpeg(List<int> bytes, int maxSide) async {
  final img = _image;
  if (img == null) return null;
  final out = await img.toJpeg(Uint8List.fromList(bytes).toJS, maxSide).toDart;
  return out?.toDart;
}
