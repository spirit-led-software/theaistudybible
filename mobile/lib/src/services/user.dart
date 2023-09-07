import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/user.dart';

class UserService {
  static Future<User> getUserInfo(String session) async {
    Response res = await get(
      Uri.parse('${API.url}/session'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to get user info: ${res.statusCode} ${res.body}");
      throw Exception('Failed to get user');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));
    debugPrint("Received: $data");

    User user = User.fromJson({
      ...data,
      'session': session,
    });

    return user;
  }
}
