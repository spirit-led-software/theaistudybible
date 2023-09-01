import 'package:flutter_config/flutter_config.dart';

class Api {
  static String url = FlutterConfig.get('API_URL');
  static String chatUrl = FlutterConfig.get('CHAT_API_URL');
}
