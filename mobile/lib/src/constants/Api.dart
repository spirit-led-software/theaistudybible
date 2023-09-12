import 'package:flutter_dotenv/flutter_dotenv.dart';

final class API {
  static final String url = dotenv.env['API_URL']!;
  static final String chatUrl = dotenv.env['CHAT_API_URL']!;
}
