import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

export 'chat/request.dart' show CreateChatRequest, UpdateChatRequest;

part 'chat.freezed.dart';
part 'chat.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class Chat with _$Chat {
  const Chat._();

  factory Chat({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String name,
    required String userId,
  }) = _Chat;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  factory Chat.fromJson(Map<String, dynamic> json) => _$ChatFromJson(json);
}
