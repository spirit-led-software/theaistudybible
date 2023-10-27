import 'package:flutter/material.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/chat.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'chat.g.dart';

@Riverpod(keepAlive: true)
class Chats extends _$Chats {
  late ChatManager _manager;

  @override
  FutureOr<Chat?> build(String? id) async {
    if (id == null) {
      return null;
    }
    _manager = await ref.watch(chatManagerProvider.future);
    return await _manager.getChat(id);
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

      return await _manager.updateChat(currentId, request).catchError((error) {
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
    final chat = await _manager.refreshChat(id!);
    state = AsyncData(chat);
    return chat;
  }
}

@Riverpod(keepAlive: true)
Future<ChatManager> chatManager(ChatManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final user = await ref.watch(currentUserProvider.future);
  return ChatManager(isar: isar, user: user);
}

class ChatManager {
  final Isar _isar;
  final UserInfo _user;

  ChatManager({
    required Isar isar,
    required UserInfo user,
  })  : _isar = isar,
        _user = user;

  Future<bool> _hasLocalChat(String id) async {
    final chat = await _isar.chats.get(fastHash(id));
    return chat != null;
  }

  Future<Chat?> getChat(String id) async {
    if (await _hasLocalChat(id)) {
      return await _getLocalChat(id);
    }
    return await _fetchChat(id);
  }

  Future<Chat> refreshChat(String id) async {
    return await _fetchChat(id);
  }

  Future<Chat?> _getLocalChat(String id) async {
    return await _isar.chats.get(fastHash(id));
  }

  Future<Chat> _fetchChat(String id) async {
    return await ChatService.getChat(id: id, session: _user.session).then((value) async {
      await _saveChat(value);
      return value;
    });
  }

  Future<Chat> createChat(CreateChatRequest request) async {
    return await ChatService.createChat(request: request, session: _user.session).then((value) async {
      await _saveChat(value);
      return value;
    });
  }

  Future<Chat> updateChat(String id, UpdateChatRequest request) async {
    return await ChatService.updateChat(id: id, request: request, session: _user.session).then((value) async {
      await _saveChat(value);
      return value;
    });
  }

  Future<int> _saveChat(Chat chat) async {
    return await _isar.writeTxn(() => _isar.chats.put(chat));
  }

  Future<void> deleteChat(String id) async {
    return await ChatService.deleteChat(id: id, session: _user.session).then((value) async {
      if (await _hasLocalChat(id)) {
        await deleteLocalChat(id);
      }
      return value;
    });
  }

  Future<void> deleteLocalChat(String id) async {
    await _isar.writeTxn(() => _isar.chats.delete(fastHash(id)));
  }

  Future<List<Chat>> getAllLocalChats() async {
    return await _isar.chats.where().findAll();
  }
}
