import 'package:dio/browser.dart';
import 'package:dio/dio.dart';

/// Web: send cookies (httpOnly refresh token) with credentialed CORS requests (PLAT-004).
void configureAdapter(Dio dio) {
  final adapter = BrowserHttpClientAdapter()..withCredentials = true;
  dio.httpClientAdapter = adapter;
}

const bool isWebPlatform = true;
