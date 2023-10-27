import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pages.g.dart';

@Riverpod(keepAlive: true)
class ChatsPages extends _$ChatsPages {
  static const int pageSize = 7;

  int _page = 1;
  bool _isLoadingInitial = true;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Chat>>> build() async {
    _loadingLogic();
    _persistenceLogic();

    try {
      await ref.watch(currentUserProvider.future);
      final currentUser = ref.watch(currentUserProvider);
      if (!currentUser.hasValue) {
        return [];
      }

      return ChatService.getChats(
        session: currentUser.value!.session,
        paginationOptions: PaginatedEntitiesRequestOptions(page: _page, limit: pageSize),
      ).then((value) {
        if (state.hasValue) {
          // replace pages previous content with new content
          return [
            ...state.value!.sublist(0, _page - 1),
            value.entities,
            if (state.value!.length > _page + 1) ...state.value!.sublist(_page + 1, state.value!.length),
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

  void _loadingLogic() {
    ref.listenSelf((_, __) {
      if (!state.isLoading) {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      } else if (state.isLoading && _page == 1 && (!state.hasValue || state.value!.isEmpty)) {
        _isLoadingInitial = true;
      } else if (state.isLoading && _page > 1) {
        _isLoadingNextPage = true;
      } else {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      }
    });
  }

  void _persistenceLogic() {
    ref.listenSelf((previous, next) async {
      if (next.hasValue && previous?.value != next.value) {
        for (final chatsPage in next.value!) {
          for (final chat in chatsPage) {
            Future.wait([
              ref.read(chatsProvider(chat.id).future),
              ref.read(chatMessagesProvider(chat.id).future),
            ]);
          }
        }

        final chatManager = ref.read(chatManagerProvider).value;
        final chatMessagesManager = ref.read(chatMessagesManagerProvider).requireValue;

        final savedChats = await chatManager?.getAllLocalChats() ?? [];
        final chatsPagesFlat = next.value!.expand((element) => element);
        for (final savedChat in savedChats) {
          if (!chatsPagesFlat.any((element) => element.id == savedChat.id)) {
            chatManager?.deleteLocalChat(savedChat.id);
            chatMessagesManager.deleteLocalChatMessagesByChatId(savedChat.id);
          }
        }
      }
    });
  }
}
