import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/Api.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/user/message.dart';

Future<PaginatedEntitiesResponse<UserMessage>> getUserMessages({
  PaginatedEntitiesRequestOptions paginationOptions =
      const PaginatedEntitiesRequestOptions(),
  required String session,
}) async {
  Response res = await get(
    Uri.parse('${Api.url}/user-messages?${paginationOptions.searchQuery}'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
  );

  if (res.statusCode != 200) {
    throw Exception('Failed to load user messages');
  }

  var data = jsonDecode(res.body);

  return PaginatedEntitiesResponse.fromJson(data, (json) {
    return UserMessage.fromJson(json as Map<String, dynamic>);
  });
}

Future<UserMessage> getUserMessage({
  required String id,
  required String session,
}) async {
  Response res = await get(
    Uri.parse('${Api.url}/user-messages/$id'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
  );

  if (res.statusCode != 200) {
    throw Exception('Failed to load user message');
  }

  var data = jsonDecode(res.body);

  return UserMessage.fromJson(data);
}

Future<PaginatedEntitiesResponse<UserMessage>> searchForUserMessages({
  PaginatedEntitiesRequestOptions paginationOptions =
      const PaginatedEntitiesRequestOptions(),
  required Query query,
  required String session,
}) async {
  Response res = await post(
    Uri.parse(
      '${Api.url}/user-messages/search?${paginationOptions.searchQuery}',
    ),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
    body: jsonEncode(query.toJson()),
  );

  if (res.statusCode != 200) {
    throw Exception('Failed to search for user messages');
  }

  var data = jsonDecode(res.body);

  return PaginatedEntitiesResponse.fromJson(data, (json) {
    return UserMessage.fromJson(json as Map<String, dynamic>);
  });
}
