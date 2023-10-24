import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'pages.g.dart';

@riverpod
class ChatsPages extends _$ChatsPages {
  static const int pageSize = 7;

  int _page = 1;
  bool _isLoadingInitial = true;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Chat>>> build() async {
    ref.listenSelf((_, __) {
      if (!state.isLoading) {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      } else if (state.isLoading &&
          _page == 1 &&
          (!state.hasValue || state.value!.isEmpty)) {
        _isLoadingInitial = true;
      } else if (state.isLoading && _page > 1) {
        _isLoadingNextPage = true;
      } else {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      }
    });

    try {
      await ref.watch(currentUserProvider.future);
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        return [];
      }

      return ChatService.getChats(
        session: currentUser.value!.session,
        paginationOptions:
            PaginatedEntitiesRequestOptions(page: _page, limit: pageSize),
      ).then((value) {
        if (state.hasValue) {
          // replace pages previous content with new content
          return [
            ...state.value!.sublist(0, _page - 1),
            value.entities,
            if (state.value!.length > _page + 1)
              ...state.value!.sublist(_page + 1, state.value!.length),
          ];
        } else {
          return [
            value.entities,
          ];
        }
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
    refresh();
  }

  void reset() {
    _page = 1;
    state = AsyncData([state.value?.first ?? []]);
    refresh();
  }

  void refresh() {
    ref.invalidateSelf();
  }

  bool isLoadingInitial() {
    return _isLoadingInitial;
  }

  bool isLoadingNextPage() {
    return _isLoadingNextPage;
  }

  Future<Chat> createChat(CreateChatRequest request) async {
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

    final chat = await ChatService.createChat(
      session: currentUser.value!.session,
      request: request,
    ).catchError((error, stackTrace) {
      debugPrint("Failed to create chat: $error $stackTrace");
      state = previousState;
      throw error;
    });

    state = AsyncData([
      [
        chat,
        ...previousState.requireValue.first,
      ],
      ...previousState.requireValue.sublist(1)
    ]);
    refresh();

    return chat;
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

    refresh();
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

    if (ref.read(currentChatIdProvider) == id) {
      ref.read(currentChatIdProvider.notifier).update(null);
    }

    refresh();
  }
}
