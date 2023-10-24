import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'chat.g.dart';

@riverpod
class Chats extends _$Chats {
  @override
  FutureOr<Chat?> build(String? id) async {
    if (id == null) {
      return null;
    }

    try {
      await ref.watch(currentUserProvider.future);
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        throw Exception("User is not logged in");
      }

      return ChatService.getChat(
        session: currentUser.value!.session,
        id: id,
      );
    } catch (error) {
      debugPrint("Failed to fetch chat: $error");
      rethrow;
    }
  }

  FutureOr<void> updateChat(UpdateChatRequest request) async {
    try {
      final currentId = id;
      if (currentId == null) {
        throw Exception("Chat ID is not set");
      }

      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        throw Exception("User is not logged in");
      }

      final previousState = state;

      state = AsyncData(
        previousState.value?.copyWith(
              name: request.name,
              updatedAt: DateTime.now(),
            ) ??
            Chat(
              id: const Uuid().v4(),
              userId: currentUser.value!.id,
              name: request.name,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
      );

      await ChatService.updateChat(
        session: currentUser.value!.session,
        id: currentId,
        request: request,
      ).catchError((error) {
        debugPrint("Failed to update chat: $error");
        state = previousState;
        throw error;
      });
      refresh();
    } catch (error) {
      debugPrint("Failed to update chat: $error");
      rethrow;
    }
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
