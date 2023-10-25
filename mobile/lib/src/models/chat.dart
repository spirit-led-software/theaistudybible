import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/chat/data.dart';

export 'chat/request.dart' show CreateChatRequest, UpdateChatRequest;

part 'chat.freezed.dart';
part 'chat.g.dart';

@freezed
class Chat with _$Chat {
  const Chat._();

  factory Chat({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String name,
    required String userId,
  }) = _Chat;

  factory Chat.fromJson(Map<String, dynamic> json) => _$ChatFromJson(json);

  EmbeddedChat toEmbedded() {
    return EmbeddedChat(
      id: id,
      createdAt: createdAt.toUtc(),
      updatedAt: updatedAt.toUtc(),
      name: name,
      userId: userId,
    );
  }
}
