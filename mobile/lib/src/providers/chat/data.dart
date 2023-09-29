import 'package:flutter/material.dart';
import 'package:quiver/collection.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@riverpod
class LoadedChatData extends _$LoadedChatData {
  @override
  FutureOr<LruMap<String, ChatData>> build() async {
    final map = state.value ?? LruMap(maximumSize: 10);
    final chatsPages = ref.watch(chatsPagesProvider);
    if (chatsPages.hasValue) {
      final futures = <Future>[];
      for (final chatsPage in chatsPages.value!) {
        for (final chat in chatsPage) {
          futures.add(
            Future.wait([
              ref.watch(currentChatMessagesProvider(chat.id).future),
            ]).then((value) {
              map[chat.id] = ChatData(chat: chat, messages: value[0]);
            }).catchError((error) {
              debugPrint("Failed to load chat data for ${chat.id}: $error");
            }),
          );
        }
      }
      await Future.wait(futures);
    }

    return map;
  }

  void addChat(ChatData chatData) {
    final map = state.value ?? LruMap(maximumSize: 10);
    map[chatData.chat.id] = chatData;
    state = AsyncData(map);
  }
}
