import 'dart:convert';
import 'dart:developer';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/Api.dart';
import 'package:revelationsai/src/models/user/user.dart';

Future<User> getUserInfo(String session) async {
  Response res = await get(
    Uri.parse('${Api.url}/session'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
  );

  if (res.statusCode != 200) {
    log("Failed to get user");
    throw Exception('Failed to get user');
  }

  var data = jsonDecode(res.body);
  log("Received: $data");

  User user = User.fromJson({
    ...data,
    'session': session,
  });

  return user;
}
