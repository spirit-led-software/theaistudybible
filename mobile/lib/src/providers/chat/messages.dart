import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'messages.g.dart';

@riverpod
class CurrentChatMessages extends _$CurrentChatMessages {
  @override
  FutureOr<List<ChatMessage>> build(String? chatId) async {
    try {
      if (chatId == null) {
        return <ChatMessage>[];
      }

      await ref.watch(currentUserProvider.future);
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        throw Exception("User is not logged in");
      }

      return ChatService.getChatMessages(
        session: currentUser.requireValue.session,
        chatId: chatId,
      );
    } catch (error) {
      debugPrint("Failed to fetch chat messages: $error");
      rethrow;
    }
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
