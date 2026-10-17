import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nearsoul/core/api.dart';
import 'package:nearsoul/core/token_store.dart';

/// Records request headers and answers 200 with an empty JSON object.
class _RecordingAdapter implements HttpClientAdapter {
  final seen = <String, Map<String, dynamic>>{};

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    seen[options.path] = Map.of(options.headers);
    return ResponseBody.fromString(jsonEncode({}), 200, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('logout carries the access token; public auth endpoints never do (AUTH-004)', () async {
    final api = Api(tokens: TokenStore())..accessToken = 'access-1';
    final adapter = _RecordingAdapter();
    api.dio.httpClientAdapter = adapter;
    await api.post('/v1/auth/logout');
    await api.post('/v1/auth/logout-all');
    await api.post('/v1/auth/code', {'email': 'a@b.co'});
    await api.post('/v1/auth/verify', {'email': 'a@b.co', 'code': '123456'});
    expect(adapter.seen['/v1/auth/logout']!['authorization'], 'Bearer access-1');
    expect(adapter.seen['/v1/auth/logout-all']!['authorization'], 'Bearer access-1');
    expect(adapter.seen['/v1/auth/code']!.containsKey('authorization'), isFalse);
    expect(adapter.seen['/v1/auth/verify']!.containsKey('authorization'), isFalse);
  });
}
