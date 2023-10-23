import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/models/user/request.dart';

class UserService {
  static Future<UserInfo> getUserInfo(String session) async {
    Response res = await get(
      Uri.parse('${API.url}/session'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to get user: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    UserInfo user = UserInfo.fromJson({
      ...data,
      'session': session,
    });

    return user;
  }

  static Future<User> updateUser({
    required String session,
    String? id,
    required UpdateUserRequest request,
  }) async {
    String url = '${API.url}/users';
    if (id != null) {
      url += '/$id';
    } else {
      url += '/me';
    }

    Response res = await put(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(request.toJson()),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to update user: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    User user = User.fromJson({
      ...data,
    });

    return user;
  }

  static Future<void> deleteUser({
    required String session,
    String? id,
  }) async {
    String url = '${API.url}/users';
    if (id != null) {
      url += '/$id';
    } else {
      url += '/me';
    }

    Response res = await delete(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to delete user: ${res.statusCode} ${res.body}');
    }
  }
}
