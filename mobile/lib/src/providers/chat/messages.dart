import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:revelationsai/src/utils/isar.dart';
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

@Riverpod(keepAlive: true)
Future<ChatMessagesManager> chatMessagesManager(ChatMessagesManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return ChatMessagesManager(isar, session);
}

class ChatMessagesManager {
  final Isar _isar;
  final String _session;

  ChatMessagesManager(
    Isar isar,
    String session,
  )   : _isar = isar,
        _session = session;

  Future<bool> _hasLocalForChatId(String chatId) async {
    final messages = await _isar.chatMessages.where().chatIdEqualTo(chatId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<ChatMessage>> getByChatId(String chatId) async {
    if (await _hasLocalForChatId(chatId)) {
      return await _getLocalByChatId(chatId);
    }

    return await _fetchByChatId(chatId);
  }

  Future<List<ChatMessage>> _getLocalByChatId(String chatId) async {
    return await _isar.chatMessages.where().chatIdEqualTo(chatId).sortByCreatedAt().findAll();
  }

  Future<List<ChatMessage>> _fetchByChatId(String chatId) async {
    return await ChatService.getChatMessages(
      session: _session,
      chatId: chatId,
    ).then((value) async {
      await deleteLocalByChatId(chatId);
      await save(value.map((e) {
        return e.copyWith(
          chatId: chatId,
        );
      }).toList());
      return value;
    });
  }

  Future<List<ChatMessage>> refreshByChatId(String chatId) async {
    return await _fetchByChatId(chatId);
  }

  Future<List<int>> save(List<ChatMessage> messages) async {
    return await _isar.writeTxn(() async {
      return await _isar.chatMessages.putAll(messages);
    });
  }

  Future<void> deleteLocalByChatId(String chatId) async {
    if (await _hasLocalForChatId(chatId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.chatMessages.where().chatIdEqualTo(chatId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.chatMessages.delete(fastHash(e.id));
        }));
      });
    }
  }
}

extension ChatMessagesManagerX on Ref {
  ChatMessagesManager get chatMessages => read(chatMessagesManagerProvider).requireValue;
}
