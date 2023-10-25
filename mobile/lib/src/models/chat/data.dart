import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'data.freezed.dart';
part 'data.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class ChatData with _$ChatData {
  const ChatData._();

  factory ChatData({
    required String id,
    required EmbeddedChat chat,
    required List<EmbeddedChatMessage> messages,
  }) = _ChatData;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  factory ChatData.fromJson(Map<String, dynamic> json) =>
      _$ChatDataFromJson(json);
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedChat with _$EmbeddedChat {
  const EmbeddedChat._();

  factory EmbeddedChat({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? name,
    String? userId,
  }) = _EmbeddedChat;

  factory EmbeddedChat.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedChatFromJson(json);

  Chat toRegular() {
    return Chat(
      id: id!,
      createdAt: createdAt!,
      updatedAt: updatedAt!,
      name: name!,
      userId: userId!,
    );
  }
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedChatMessage with _$EmbeddedChatMessage {
  const EmbeddedChatMessage._();

  factory EmbeddedChatMessage({
    String? id,
    String? uuid,
    DateTime? createdAt,
    String? content,
    @Default(Role.user) Role role,
    String? name,
  }) = _EmbeddedChatMessage;

  @override
  @enumerated
  // ignore: recursive_getters
  Role get role => role;

  factory EmbeddedChatMessage.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedChatMessageFromJson(json);

  ChatMessage toRegular() {
    return ChatMessage(
      id: id!,
      uuid: uuid,
      createdAt: createdAt,
      content: content!,
      role: role,
      name: name,
    );
  }
}
