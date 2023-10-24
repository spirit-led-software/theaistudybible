import 'dart:convert';

import 'package:http/http.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:path/path.dart' as path;
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

class UserService {
  static Future<UserInfo> getUserInfo(String session) async {
    Response res = await get(
      Uri.parse('${API.url}/session'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    UserInfo user = UserInfo.fromJson({
      ...data,
      'session': session,
    });
    return user;
  }

  static Future<User> updateUser({
    required String session,
    required String id,
    required UpdateUserRequest request,
  }) async {
    final url = '${API.url}/users/$id';
    Response res = await put(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(request.toJson()),
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    User user = User.fromJson(data);
    return user;
  }

  static Future<void> deleteUser({
    required String session,
    required String id,
  }) async {
    final url = '${API.url}/users/$id';

    Response res = await delete(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }
  }

  static Future<String> uploadProfilePicture({
    required CroppedFile file,
    required String session,
  }) async {
    final urlRequest = await post(
      Uri.parse('${API.url}/users/profile-pictures/presigned-url'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode({
        'fileType': path.extension(file.path),
      }),
    );

    if (!urlRequest.ok) {
      throw urlRequest.exception;
    }

    final data = jsonDecode(utf8.decode(urlRequest.bodyBytes));
    final url = Uri.parse(data['url']);

    final uploadRequest = await put(
      url,
      headers: <String, String>{
        'Content-Type': path.extension(file.path),
      },
      body: await file.readAsBytes(),
    );

    if (!uploadRequest.ok) {
      throw uploadRequest.exception;
    }

    return url.toString().split('?')[0];
  }

  static Future<void> updatePassword({
    required String session,
    required UpdatePasswordRequest request,
  }) async {
    const url = '${API.url}/users/change-password';

    final res = await post(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(request.toJson()),
    );

    if (!res.ok) {
      throw res.exception;
    }
  }
}
