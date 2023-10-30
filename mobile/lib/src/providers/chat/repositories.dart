import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/chat/single.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repositories.g.dart';

@Riverpod(keepAlive: true)
Future<ChatRepository> chatRepository(ChatRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return ChatRepository(ref, isar, session);
}

class ChatRepository {
  final ChatRepositoryRef _ref;
  final Isar _isar;
  final String _session;

  ChatRepository(ChatRepositoryRef ref, Isar isar, String session)
      : _ref = ref,
        _isar = isar,
        _session = session;

  Future<bool> _hasLocal(String id) async {
    final chat = await _isar.chats.get(fastHash(id));
    return chat != null;
  }

  Future<Chat?> getChat(String id) async {
    if (await _hasLocal(id)) {
      return await _getLocal(id);
    }
    return await _fetch(id);
  }

  Future<Chat> refresh(String id) async {
    return await _fetch(id);
  }

  Future<Chat?> _getLocal(String id) async {
    return await _isar.chats.get(fastHash(id));
  }

  Future<Chat> _fetch(String id) async {
    return await ChatService.getChat(id: id, session: _session).then((value) async {
      await _save(value);
      return value;
    });
  }

  Future<Chat> create(CreateChatRequest request) async {
    return await ChatService.createChat(request: request, session: _session).then((value) async {
      await _save(value);
      _ref.invalidate(chatsPagesProvider);
      return value;
    });
  }

  Future<Chat> update(String id, UpdateChatRequest request) async {
    return await ChatService.updateChat(id: id, request: request, session: _session).then((value) async {
      await _save(value);
      _ref.invalidate(singleChatProvider(id));
      _ref.invalidate(chatsPagesProvider);
      return value;
    });
  }

  Future<List<int>> _saveMany(List<Chat> chats) async {
    return await _isar.writeTxn(() => _isar.chats.putAll(chats));
  }

  Future<int> _save(Chat chat) async {
    return await _isar.writeTxn(() => _isar.chats.put(chat));
  }

  Future<void> deleteRemote(String id) async {
    return await ChatService.deleteChat(id: id, session: _session).then((value) async {
      if (await _hasLocal(id)) {
        await deleteLocal(id);
      }
      _ref.invalidate(chatsPagesProvider);
      return value;
    });
  }

  Future<void> deleteLocal(String id) async {
    await _isar.writeTxn(() => _isar.chats.delete(fastHash(id)));
  }

  Future<List<Chat>> getAllLocal() async {
    return await _isar.chats.where().findAll();
  }

  Future<List<Chat>> _fetchPage(PaginatedEntitiesRequestOptions options) async {
    return await ChatService.getChats(session: _session, paginationOptions: options).then((value) async {
      await _saveMany(value.entities);
      return value.entities;
    });
  }

  Future<List<Chat>> getPage(PaginatedEntitiesRequestOptions options) async {
    if (await _isar.chats.count() >= (options.page * options.limit)) {
      return await _isar.chats
          .where()
          .sortByCreatedAtDesc()
          .offset((options.page - 1) * options.limit)
          .limit(options.limit)
          .findAll();
    }
    return await _fetchPage(options);
  }

  Future<List<Chat>> refreshPage(PaginatedEntitiesRequestOptions options) async {
    return await _fetchPage(options);
  }
}

@Riverpod(keepAlive: true)
Future<ChatMessagesRepository> chatMessagesRepository(ChatMessagesRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return ChatMessagesRepository(isar, session);
}

class ChatMessagesRepository {
  final Isar _isar;
  final String _session;

  ChatMessagesRepository(
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

extension ChatRepositoryRefX on Ref {
  ChatRepository get chats => watch(chatRepositoryProvider).requireValue;
  ChatMessagesRepository get chatMessages => watch(chatMessagesRepositoryProvider).requireValue;
}

extension ChatRepositoryWidgetRefX on WidgetRef {
  ChatRepository get chats => watch(chatRepositoryProvider).requireValue;
  ChatMessagesRepository get chatMessages => watch(chatMessagesRepositoryProvider).requireValue;
}
