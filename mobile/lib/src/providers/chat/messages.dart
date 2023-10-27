import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'messages.g.dart';

@Riverpod(keepAlive: true)
class ChatMessages extends _$ChatMessages {
  late ChatMessagesManager _manager;

  @override
  FutureOr<List<ChatMessage>> build(String? chatId) async {
    if (chatId == null) {
      return <ChatMessage>[];
    }
    _manager = await ref.watch(chatMessagesManagerProvider.future);
    return await _manager.getChatMessagesByChatId(chatId);
  }

  Future<List<ChatMessage>> refresh() async {
    final messages = await _manager.refreshChatMessagesByChatId(chatId!);
    state = AsyncData(messages);
    return messages;
  }

  Future<void> delete() async {
    await _manager.deleteSavedChatMessagesByChatId(chatId!);
    ref.invalidateSelf();
  }
}

@Riverpod(keepAlive: true)
Future<ChatMessagesManager> chatMessagesManager(ChatMessagesManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final user = await ref.watch(currentUserProvider.future);
  return ChatMessagesManager(
    isar: isar,
    user: user,
  );
}

class ChatMessagesManager {
  final Isar _isar;
  final UserInfo _user;

  ChatMessagesManager({
    required Isar isar,
    required UserInfo user,
  })  : _isar = isar,
        _user = user;

  Future<bool> _hasChatMessagesForChatId(String chatId) async {
    final messages = await _isar.chatMessages.where().chatIdEqualTo(chatId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<ChatMessage>> getChatMessagesByChatId(String chatId) async {
    if (await _hasChatMessagesForChatId(chatId)) {
      return await _getSavedChatMessagesByChatId(chatId);
    }

    return await _fetchChatMessagesByChatId(chatId);
  }

  Future<List<ChatMessage>> _getSavedChatMessagesByChatId(String chatId) async {
    return await _isar.chatMessages.where().chatIdEqualTo(chatId).sortByCreatedAt().findAll();
  }

  Future<List<ChatMessage>> _fetchChatMessagesByChatId(String chatId) async {
    return await ChatService.getChatMessages(
      session: _user.session,
      chatId: chatId,
    ).then((value) async {
      return await saveChatMessages(value.map((e) {
        return e.copyWith(
          chatId: chatId,
        );
      }).toList());
    });
  }

  Future<List<ChatMessage>> refreshChatMessagesByChatId(String chatId) async {
    return await _fetchChatMessagesByChatId(chatId);
  }

  Future<List<ChatMessage>> saveChatMessages(List<ChatMessage> messages) async {
    await _isar.writeTxn(() async {
      await Future.wait(messages.map((e) async {
        await _isar.chatMessages.put(e);
      }));
    });
    return messages;
  }

  Future<void> deleteSavedChatMessagesByChatId(String chatId) async {
    if (await _hasChatMessagesForChatId(chatId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.chatMessages.where().chatIdEqualTo(chatId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.chatMessages.delete(fastHash(e.id));
        }));
      });
    }
  }
}
