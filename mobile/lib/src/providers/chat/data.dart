import 'package:flutter/material.dart';
import 'package:quiver/collection.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@riverpod
class LoadedChatData extends _$LoadedChatData {
  static const int maxSize = 10;

  @override
  FutureOr<LruMap<String, ChatData>> build() async {
    final map = state.value ?? LruMap(maximumSize: maxSize);
    final chatsPages = ref.watch(chatsPagesProvider);
    if (chatsPages.hasValue) {
      int amountFetched = 0;
      outerLoop:
      for (final chatsPage in chatsPages.value!) {
        final futures = <Future>[];
        for (final chat in chatsPage) {
          if (amountFetched < maxSize) {
            futures.add(
              Future.wait([
                ref.watch(currentChatMessagesProvider(chat.id).future),
              ]).then((value) {
                final foundMessages = value[0];
                map[chat.id] = ChatData(chat: chat, messages: foundMessages);
              }).catchError((error) {
                debugPrint("Failed to load chat data for ${chat.id}: $error");
              }),
            );
            amountFetched++;
          } else {
            await Future.wait(futures);
            break outerLoop;
          }
        }
        await Future.wait(futures);
      }
    }

    return map;
  }

  void addChat(ChatData chatData) {
    final map = state.value ?? LruMap(maximumSize: maxSize);
    map[chatData.chat.id] = chatData;
    state = AsyncData(map);
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
