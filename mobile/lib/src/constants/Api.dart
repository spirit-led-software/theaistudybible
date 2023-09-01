import 'package:flutter_config/flutter_config.dart';

final class Api {
  static final String url = FlutterConfig.get('API_URL');
  static final String chatUrl = FlutterConfig.get('CHAT_API_URL');
}
