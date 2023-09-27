import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'chat.g.dart';

@riverpod
class ChatById extends _$ChatById {
  String? _id;

  @override
  FutureOr<Chat> build(String id) async {
    _id = id;
    try {
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
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        throw Exception("User is not logged in");
      }

      if (_id == null) {
        throw Exception("Chat ID not provided");
      }

      final previousState = state;

      state = AsyncData(
        previousState.requireValue.copyWith(
          name: request.name,
          updatedAt: DateTime.now(),
        ),
      );

      await ChatService.updateChat(
        session: currentUser.value!.session,
        id: _id!,
        request: request,
      ).catchError((error) {
        debugPrint("Failed to update chat: $error");
        state = previousState;
        throw error;
      });

      ref.invalidateSelf();
    } catch (error) {
      debugPrint("Failed to update chat: $error");
      rethrow;
    }
  }
}
