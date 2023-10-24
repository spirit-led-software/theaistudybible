import 'dart:convert';

import 'package:http/http.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:path/path.dart' as path;
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

    if (res.statusCode != 200) {
      throw Exception('Failed to update user: ${res.statusCode} ${res.body}');
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

    if (res.statusCode != 200) {
      throw Exception('Failed to delete user: ${res.statusCode} ${res.body}');
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

    if (urlRequest.statusCode != 200) {
      throw Exception(
          'Failed to get upload url: ${urlRequest.statusCode} ${urlRequest.body}');
    }

    final data = jsonDecode(utf8.decode(urlRequest.bodyBytes));

    final url = data['url'];

    final uploadRequest = await put(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': path.extension(file.path),
      },
      body: await file.readAsBytes(),
    );

    if (uploadRequest.statusCode != 200) {
      throw Exception(
          'Failed to upload image: ${uploadRequest.statusCode} ${uploadRequest.body}');
    }

    return Uri.parse(url).replace(queryParameters: {}).toString();
  }

  static Future<void> updatePassword({
    required String session,
    required UpdatePasswordRequest request,
  }) async {
    const url = '${API.url}/users/change-password';

    Response res = await post(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(request.toJson()),
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to update password: ${res.statusCode} ${res.body}');
    }
  }
}
