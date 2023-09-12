import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'pages.g.dart';

@riverpod
class ChatsPages extends _$ChatsPages {
  int _page = 1;
  bool _isLoadingInitial = true;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Chat>>> build() async {
    ref.listenSelf((_, __) {
      if (!state.isLoading) {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      } else if (state.isLoading && _page == 1) {
        _isLoadingInitial = true;
      } else if (state.isLoading && _page > 1) {
        _isLoadingNextPage = true;
      } else {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      }
    });

    try {
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        throw Exception("User is not logged in");
      }

      return ChatService.getChats(
        session: currentUser.value!.session,
        paginationOptions:
            PaginatedEntitiesRequestOptions(page: _page, limit: 7),
      ).then((value) {
        return [
          if (state.hasValue) ...state.value!,
          value.entities,
        ];
      });
    } catch (error) {
      debugPrint("Failed to fetch chats: $error");
      rethrow;
    }
  }

  bool hasNextPage() {
    return (state.value?.last.length ?? 0) >= 7;
  }

  void fetchNextPage() {
    _page++;
    ref.invalidateSelf();
  }

  void reset() {
    _page = 1;
    state = AsyncData([state.value?.first ?? []]);
    ref.invalidateSelf();
  }

  bool isLoadingInitial() {
    return _isLoadingInitial;
  }

  bool isLoadingNextPage() {
    return _isLoadingNextPage;
  }

  FutureOr<void> createChat(CreateChatRequest request) async {
    final currentUser = ref.read(currentUserProvider);

    final previousState = state;

    final newChat = Chat(
      id: request.id ?? const Uuid().v4(),
      name: request.name,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      userId: currentUser.requireValue.id,
    );

    state = AsyncData([
      [
        newChat,
        ...state.requireValue.first,
      ],
      ...state.requireValue.sublist(1)
    ]);

    await ChatService.createChat(
      session: currentUser.value!.session,
      request: request,
    ).catchError((error, stackTrace) {
      debugPrint("Failed to create chat: $error $stackTrace");
      state = previousState;
      throw error;
    });

    ref.invalidateSelf();
  }

  FutureOr<void> updateChat(String id, UpdateChatRequest request) async {
    final currentUser = ref.read(currentUserProvider);

    final previousState = state;

    state = AsyncData(state.requireValue.map((chats) {
      return chats.map((chat) {
        if (chat.id == id) {
          return chat.copyWith(
            name: request.name,
            updatedAt: DateTime.now(),
          );
        }
        return chat;
      }).toList();
    }).toList());

    await ChatService.updateChat(
      session: currentUser.requireValue.session,
      id: id,
      request: request,
    ).catchError((error, stackTrace) {
      debugPrint("Failed to edit chat: $error $stackTrace");
      state = previousState;
      throw error;
    });

    ref.invalidateSelf();
  }

  FutureOr<void> deleteChat(String id) async {
    final currentUser = ref.read(currentUserProvider);

    final previousState = state;

    state = AsyncData(state.requireValue.map((chats) {
      return chats.where((chat) => chat.id != id).toList();
    }).toList());

    await ChatService.deleteChat(
      session: currentUser.requireValue.session,
      id: id,
    ).catchError((error, stackTrace) {
      debugPrint("Failed to delete chat: $error $stackTrace");
      state = previousState;
    });

    ref.invalidateSelf();
  }
}
