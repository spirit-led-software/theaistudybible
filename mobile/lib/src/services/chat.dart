import 'dart:convert';
import 'dart:developer';

import 'package:http/http.dart';
import 'package:revelationsai/src/models/chat/chat_request.dart';
import 'package:revelationsai/src/models/pagination.dart';

import '../constants/Api.dart';
import '../models/chat/chat.dart';

Future<PaginatedEntitiesResponse<Chat>> getChats({
  PaginatedEntitiesRequestOptions paginationOptions =
      const PaginatedEntitiesRequestOptions(),
  required String session,
}) async {
  Response res = await get(
    Uri.parse('${Api.url}/chats'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
  );

  if (res.statusCode != 200) {
    log("Failed to load chats: ${res.statusCode} ${res.body}");
    throw Exception('Failed to load chats');
  }

  var data = jsonDecode(res.body);

  return PaginatedEntitiesResponse.fromJson(data, (json) {
    return Chat.fromJson(json as Map<String, dynamic>);
  });
}

Future<Chat> getChat({
  required String chatId,
  required String session,
}) async {
  Response res = await get(
    Uri.parse('${Api.url}/chats/$chatId'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
    },
  );

  if (res.statusCode != 200) {
    log("Failed to get chat: ${res.statusCode} ${res.body}");
    throw Exception('Failed to get chat');
  }

  var data = jsonDecode(res.body);

  return Chat.fromJson(data);
}

Future<Chat> createChat({
  required String session,
  required CreateChatRequest request,
}) async {
  Response res = await post(
    Uri.parse('${Api.url}/chats'),
    headers: <String, String>{
      'Authorization': 'Bearer $session',
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonEncode(request.toJson()),
  );

  if (res.statusCode != 200) {
    log("Failed to create chat: ${res.statusCode} ${res.body}");
    throw Exception('Failed to create chat');
  }

  var data = jsonDecode(res.body);

  return Chat.fromJson(data);
}
