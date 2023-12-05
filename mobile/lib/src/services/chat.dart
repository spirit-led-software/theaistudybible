import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:revelationsai/src/services/user/message.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';
import 'package:uuid/uuid.dart';

import '../constants/api.dart';
import '../models/chat.dart';

class ChatService {
  static Future<PaginatedEntitiesResponseData<Chat>> getChats({
    PaginatedEntitiesRequestOptions paginationOptions = const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    Response res = await get(
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
      return Chat.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<Chat> getChat({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/chats/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return Chat.fromJson(data);
  }

  static Future<Chat> createChat({
    required String session,
    required CreateChatRequest request,
  }) async {
    Response res = await post(
      Uri.parse('${API.url}/chats'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(request.toJson()),
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return Chat.fromJson(data);
  }

  static Future<Chat> updateChat({
    required String session,
    required String id,
    required UpdateChatRequest request,
  }) async {
    Response res = await put(
      Uri.parse('${API.url}/chats/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(request.toJson()),
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return Chat.fromJson(data);
  }

  static Future<void> deleteChat({
    required String session,
    required String id,
  }) async {
    Response res = await delete(
      Uri.parse('${API.url}/chats/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }
  }

  static Future<List<ChatMessage>> getChatMessages({
    required String session,
    required String chatId,
  }) async {
    final messagesPage = await UserMessageService.searchForUserMessages(
      paginationOptions: const PaginatedEntitiesRequestOptions(
        limit: 100,
      ),
      query: Query(
        AND: [
          Query(
            eq: ColumnValue(
              column: 'chatId',
              value: chatId,
            ),
          ),
        ],
      ),
      session: session,
    );

    final messages = await Future.wait(messagesPage.entities.map(
      (userMessage) async {
        final ChatMessage message = ChatMessage(
          id: userMessage.aiId ?? userMessage.id,
          uuid: userMessage.id,
          content: userMessage.text,
          createdAt: userMessage.createdAt,
          role: Role.user,
        );

        final responsesPage = await AiResponseService.searchForAiResponses(
          paginationOptions: const PaginatedEntitiesRequestOptions(
            limit: 100,
          ),
          query: Query(
            AND: [
              Query(
                eq: ColumnValue(
                  column: 'userMessageId',
                  value: userMessage.id,
                ),
              ),
            ],
          ),
          session: session,
        );

        final replies = responsesPage.entities.where((element) => !element.failed && !element.regenerated).map(
              (aiResponse) => ChatMessage(
                id: aiResponse.aiId ?? aiResponse.id,
                uuid: aiResponse.id,
                content: aiResponse.text ?? "",
                createdAt: aiResponse.createdAt,
                role: Role.assistant,
              ),
            );
        return [
          replies.firstOrNull ??
              ChatMessage(
                id: const Uuid().v4(),
                content: "Failed message",
                role: Role.assistant,
              ),
          message
        ];
      },
    ));

    return messages
        .expand(
          (element) => element,
        )
        .toList()
        .reversed
        .toList();
  }
}
