import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/repositories.dart';
import 'package:revelationsai/src/providers/chat/single.dart';
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

    return await ref.chats.getPage(PaginatedEntitiesRequestOptions(page: _page, limit: pageSize)).then((value) {
      if (state.hasValue) {
        // replace pages previous content with new content
        return [
          ...state.value!.sublist(0, _page - 1),
          value,
          if (state.value!.length > _page + 1) ...state.value!.sublist(_page + 1, state.value!.length),
        ];
      } else {
        return [
          value,
        ];
      }
    });
  }

  bool hasNextPage() {
    return (state.value?.last.length ?? 0) >= pageSize;
  }

  Future<void> fetchNextPage() async {
    _page++;
    ref.invalidateSelf();
    await future;
  }

  Future<void> reset() async {
    _page = 1;
    state = AsyncData([state.value?.first ?? []]);
    ref.invalidateSelf();
    await future;
  }

  Future<void> deleteChat(String chatId) async {
    final previousState = state;
    state = AsyncValue.data(state.value
            ?.map(
              (page) => page.where((chat) => chat.id != chatId).toList(),
            )
            .toList() ??
        []);
    return await ref.chats.deleteRemote(chatId).catchError((error) {
      debugPrint("Failed to delete chat: $error");
      state = previousState;
      throw error;
    });
  }

  Future<List<List<Chat>>> refresh() async {
    final futures = <Future<List<Chat>>>[];
    for (int i = 1; i <= _page; i++) {
      futures.add(ref.chats.refreshPage(PaginatedEntitiesRequestOptions(page: i, limit: pageSize)));
    }
    return await Future.wait(futures).then((value) async {
      state = AsyncData(value);
      return value;
    });
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
              ref.read(singleChatProvider(chat.id).future),
              ref.read(chatMessagesProvider(chat.id).future),
            ]);
          }
        }

        final savedChats = await ref.chats.getAllLocal();
        final chatsPagesFlat = next.value!.expand((element) => element);
        for (final savedChat in savedChats) {
          if (!chatsPagesFlat.any((element) => element.id == savedChat.id)) {
            ref.chats.deleteLocal(savedChat.id);
            ref.chatMessages.deleteLocalByChatId(savedChat.id);
          }
        }
      }
    });
  }
}
