import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/user/message.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

class UserMessageService {
  static Future<PaginatedEntitiesResponseData<UserMessage>> getUserMessages({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/user-messages?${paginationOptions.searchQuery}'),
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
      return UserMessage.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<UserMessage> getUserMessage({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/user-messages/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return UserMessage.fromJson(data);
  }

  static Future<PaginatedEntitiesResponseData<UserMessage>>
      searchForUserMessages({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
    required Query query,
    required String session,
  }) async {
    Response res = await post(
      Uri.parse(
        '${API.url}/user-messages/search?${paginationOptions.searchQuery}',
      ),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(query.toJson()),
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return UserMessage.fromJson(json as Map<String, dynamic>);
    });
  }
}
