import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@Riverpod(keepAlive: true)
Future<ChatDataManager> chatDataManager(ChatDataManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return ChatDataManager(isar);
}

class ChatDataManager {
  final Isar _isar;

  ChatDataManager(this._isar);

  void addChat(ChatData chatData) async {
    await _isar.writeTxn(() async {
      await _isar.chatDatas.put(chatData);
    });
  }

  Future<ChatData?> getChat(String id) async {
    return await _isar.chatDatas.get(fastHash(id));
  }

  Future<bool> hasChat(String id) async {
    return await _isar.chatDatas.get(fastHash(id)) != null;
  }

  Future<void> deleteChat(String id) async {
    await _isar.writeTxn(() async {
      await _isar.chatDatas.delete(fastHash(id));
    });
  }

  Future<List<ChatData>> getAllChats() async {
    return await _isar.chatDatas.where().findAll();
  }
}
