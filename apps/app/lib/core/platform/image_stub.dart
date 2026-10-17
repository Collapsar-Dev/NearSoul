/// Native: image_picker already returns JPEG (iOS converts HEIC when resizing).
Future<List<int>?> toJpeg(List<int> bytes, int maxSide) async => null;
