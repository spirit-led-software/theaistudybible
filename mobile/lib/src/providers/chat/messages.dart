import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'messages.g.dart';

@Riverpod(keepAlive: true)
class ChatMessages extends _$ChatMessages {
  @override
  FutureOr<List<ChatMessage>> build(String? chatId) async {
    if (chatId == null) {
      return <ChatMessage>[];
    }

    return await ref.chatMessages.getByChatId(chatId);
  }

  Future<List<ChatMessage>> refresh() async {
    if (chatId == null) {
      final messages = <ChatMessage>[];
      state = AsyncData(messages);
      return messages;
    }
    final messages = await ref.chatMessages.refreshByChatId(chatId!);
    state = AsyncData(messages);
    return messages;
  }
}
