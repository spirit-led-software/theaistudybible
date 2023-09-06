import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:revelationsai/src/services/user/message.dart';

import '../constants/Api.dart';
import '../models/chat.dart';

class ChatService {
  static Future<PaginatedEntitiesResponseData<Chat>> getChats({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/chats?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to load chats: ${res.statusCode} ${res.body}");
      throw Exception('Failed to load chats');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return Chat.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<Chat> getChat({
    required String chatId,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/chats/$chatId'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to get chat: ${res.statusCode} ${res.body}");
      throw Exception('Failed to get chat');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return Chat.fromJson(data);
  }

  static Future<Chat> createChat({
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
      debugPrint("Failed to create chat: ${res.statusCode} ${res.body}");
      throw Exception('Failed to create chat');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return Chat.fromJson(data);
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

        final replies = responsesPage.entities
            .where(
                (aiResponse) => !aiResponse.failed && !aiResponse.regenerated)
            .map(
              (aiResponse) => ChatMessage(
                id: aiResponse.aiId ?? aiResponse.id,
                uuid: aiResponse.id,
                content: aiResponse.text ?? "",
                role: Role.assistant,
              ),
            );
        return [replies.first, message];
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
