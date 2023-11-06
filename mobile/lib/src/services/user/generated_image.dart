import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

class UserGeneratedImageService {
  static Future<PaginatedEntitiesResponseData<UserGeneratedImage>> getUserGeneratedImages({
    PaginatedEntitiesRequestOptions paginationOptions = const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    final res = await http.get(
      Uri.parse('${API.url}/chats?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return UserGeneratedImage.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<UserGeneratedImage> getUserGeneratedImage({required String id, required String session}) async {
    final response = await http.get(
      Uri.parse('${API.url}/generated-image/$id'),
      headers: {
        'Authorization': 'Bearer $session',
      },
    );
    if (response.statusCode == 200) {
      return UserGeneratedImage.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load user generated image');
    }
  }

  static Future<UserGeneratedImage> createUserGeneratedImage(
      {required String session, required CreateUserGeneratedImageRequest request}) async {
    final response = await http.post(
      Uri.parse('${API.url}/generated-image'),
      headers: {
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(request.toJson()),
    );

    if (!response.ok) {
      throw response.exception;
    }

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    return UserGeneratedImage.fromJson(data);
  }

  static Future<void> deleteUserGeneratedImage({required String id, required String session}) async {
    final response = await http.delete(
      Uri.parse('${API.url}/generated-image/$id'),
      headers: {
        'Authorization': 'Bearer $session',
      },
    );

    if (!response.ok) {
      throw response.exception;
    }
  }
}
