import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat/repositories.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'single.g.dart';

@Riverpod(keepAlive: true)
class SingleChat extends _$SingleChat {
  @override
  FutureOr<Chat?> build(String? id) async {
    if (id == null) {
      return null;
    }

    return await ref.chats.getChat(id);
  }

  Future<Chat> updateChat(UpdateChatRequest request) async {
    try {
      final currentId = id;
      if (currentId == null) {
        throw Exception("Chat ID is not set");
      }

      final previousState = state;

      state = AsyncData(
        previousState.value?.copyWith(
              name: request.name,
              updatedAt: DateTime.now(),
            ) ??
            Chat(
              id: const Uuid().v4(),
              userId: ref.read(currentUserProvider).requireValue.id,
              name: request.name,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
      );

      return await ref.chats.update(currentId, request).catchError((error) {
        debugPrint("Failed to update chat: $error");
        state = previousState;
        throw error;
      });
    } catch (error) {
      debugPrint("Failed to update chat: $error");
      rethrow;
    } finally {
      refresh();
    }
  }

  Future<void> deleteChat() async {
    try {
      final currentId = id;
      if (currentId == null) {
        throw Exception("Chat ID is not set");
      }

      state = const AsyncValue.data(null);
      await ref.chats.deleteRemote(currentId);
    } catch (error) {
      debugPrint("Failed to delete chat: $error");
      refresh();
      rethrow;
    }
  }

  Future<Chat> refresh() async {
    final chat = await ref.chats.refresh(id!);
    state = AsyncData(chat);
    return chat;
  }
}
