import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'chat.g.dart';

@Riverpod(keepAlive: true)
class Chats extends _$Chats {
  @override
  FutureOr<Chat?> build(String? id) async {
    if (id == null) {
      return null;
    }
    return await ref.chats.getChat(id);
  }

  Future<Chat> updateChat(UpdateChatRequest request) async {
    try {
      final currentId = id;
      if (currentId == null) {
        throw Exception("Chat ID is not set");
      }

      final previousState = state;

      state = AsyncData(
        previousState.value?.copyWith(
              name: request.name,
              updatedAt: DateTime.now(),
            ) ??
            Chat(
              id: const Uuid().v4(),
              userId: ref.read(currentUserProvider).requireValue.id,
              name: request.name,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
      );

      return await ref.chats.update(currentId, request).catchError((error) {
        debugPrint("Failed to update chat: $error");
        state = previousState;
        throw error;
      });
    } catch (error) {
      debugPrint("Failed to update chat: $error");
      rethrow;
    } finally {
      refresh();
    }
  }

  Future<Chat> refresh() async {
    final chat = await ref.chats.refresh(id!);
    state = AsyncData(chat);
    return chat;
  }
}

@Riverpod(keepAlive: true)
Future<ChatManager> chatManager(ChatManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return ChatManager(ref, isar, session);
}

class ChatManager {
  final ChatManagerRef _ref;
  final Isar _isar;
  final String _session;

  ChatManager(ChatManagerRef ref, Isar isar, String session)
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
      _ref.invalidate(chatsProvider(id));
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

extension ChatManagerRefX on Ref<Object?> {
  ChatManager get chats => watch(chatManagerProvider).requireValue;
}
