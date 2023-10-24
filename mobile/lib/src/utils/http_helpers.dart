import 'dart:convert';

import 'package:http/http.dart';

class RAIHttpException implements Exception {
  final int statusCode;
  final String message;

  RAIHttpException(this.statusCode, this.message);

  @override
  String toString() {
    return message;
  }

  bool get isBadRequest => statusCode == 400;
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isInternalServerError => statusCode == 500;

  static RAIHttpException fromResponse(Response res) {
    try {
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return RAIHttpException(
        res.statusCode,
        data['error'] ?? data['message'] ?? res.reasonPhrase ?? 'Unknown error',
      );
    } catch (e) {
      return RAIHttpException(
        res.statusCode,
        res.reasonPhrase ?? 'Unknown error',
      );
    }
  }
}

extension RAIResponseExtension on Response {
  bool get ok => statusCode >= 200 && statusCode < 300;

  RAIHttpException get exception => RAIHttpException.fromResponse(this);
}
