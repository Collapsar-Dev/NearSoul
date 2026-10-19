import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'config.dart';
import 'token_store.dart';
import 'platform/http_adapter_stub.dart' if (dart.library.js_interop) 'platform/http_adapter_web.dart';

/// Server error in the PRD format: { error: { code, message, request_id, details } }.
class ApiError implements Exception {
  ApiError(this.status, this.code, this.message, [this.details]);
  final int status;
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  bool get isNetwork => status == 0;

  @override
  String toString() => 'ApiError($status, $code)';
}

/// HTTP client with access-token injection and single-flight refresh.
class Api {
  Api({required this.tokens}) {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 25),
      headers: {if (isWebPlatform) 'x-client': 'web'},
    ));
    configureAdapter(dio);
    // Public auth endpoints take no bearer and never trigger a refresh; logout / logout-all do need the token.
    bool isPublicAuth(String path) => const ['/v1/auth/code', '/v1/auth/verify', '/v1/auth/refresh'].contains(path);
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final t = accessToken;
        if (t != null && !isPublicAuth(options.path)) options.headers['authorization'] = 'Bearer $t';
        options.headers['accept-language'] = locale;
        handler.next(options);
      },
      onError: (err, handler) async {
        final req = err.requestOptions;
        final retriable = err.response?.statusCode == 401 && !isPublicAuth(req.path) && req.extra['retried'] != true;
        if (retriable && await refresh()) {
          req.extra['retried'] = true;
          req.headers['authorization'] = 'Bearer $accessToken';
          try {
            return handler.resolve(await dio.fetch(req));
          } on DioException catch (e) {
            return handler.next(e);
          }
        }
        if (err.response?.statusCode == 401 && !isPublicAuth(req.path) && !req.path.startsWith('/v1/auth/logout')) onSessionExpired?.call();
        handler.next(err);
      },
    ));
  }

  late final Dio dio;
  final TokenStore tokens;
  String? accessToken;
  String locale = 'en';
  VoidCallback? onSessionExpired;
  void Function(String token)? onTokenChanged;
  Future<bool>? _refreshing;

  /// Refreshes the access token once even if many requests fail at the same time.
  Future<bool> refresh() {
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<bool> _doRefresh() async {
    try {
      final stored = await tokens.readRefresh();
      if (!isWebPlatform && stored == null) return false;
      final res = await dio.post('/v1/auth/refresh',
          data: isWebPlatform ? {} : {'refreshToken': stored},
          options: Options(headers: {if (isWebPlatform) 'x-requested-with': 'NearSoul'}));
      accessToken = res.data['accessToken'] as String;
      await tokens.writeRefresh(res.data['refreshToken'] as String?);
      onTokenChanged?.call(accessToken!);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> setTokens(Map<String, dynamic> data) async {
    accessToken = data['accessToken'] as String;
    await tokens.writeRefresh(data['refreshToken'] as String?);
    onTokenChanged?.call(accessToken!);
  }

  Future<void> clear() async {
    accessToken = null;
    await tokens.clear();
  }

  Future<T> _wrap<T>(Future<Response<dynamic>> Function() call) async {
    try {
      final res = await call();
      return res.data as T;
    } on DioException catch (e) {
      throw _toApiError(e);
    }
  }

  ApiError _toApiError(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['error'] is Map) {
      final err = data['error'] as Map;
      return ApiError(e.response!.statusCode ?? 500, err['code'] as String? ?? 'ERROR', err['message'] as String? ?? 'Error',
          (err['details'] as Map?)?.cast<String, dynamic>());
    }
    if (e.response == null) return ApiError(0, 'NETWORK', 'Network error');
    return ApiError(e.response!.statusCode ?? 500, 'HTTP_${e.response!.statusCode}', 'Error');
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) => _wrap(() => dio.get(path, queryParameters: query));
  Future<T> post<T>(String path, [Object? body, Map<String, String>? headers]) =>
      _wrap(() => dio.post(path, data: body ?? {}, options: headers == null ? null : Options(headers: headers)));
  Future<T> put<T>(String path, [Object? body]) => _wrap(() => dio.put(path, data: body ?? {}));
  Future<T> patch<T>(String path, [Object? body]) => _wrap(() => dio.patch(path, data: body ?? {}));
  Future<T> delete<T>(String path) => _wrap(() => dio.delete(path));

  Future<Map<String, dynamic>> upload(String path, String field, List<int> bytes, String filename, {Map<String, String> fields = const {}}) {
    final form = FormData.fromMap({...fields, field: MultipartFile.fromBytes(bytes, filename: filename)});
    return _wrap(() => dio.post(path, data: form));
  }
}
