import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'message.freezed.dart';
part 'message.g.dart';

enum Role {
  user,
  assistant,
  system,
  function;
}

@freezed
@Collection(ignore: {'copyWith'})
class ChatMessage with _$ChatMessage {
  const ChatMessage._();

  factory ChatMessage({
    required String id,
    @Index() String? uuid,
    DateTime? createdAt,
    required String content,
    required Role role,
    String? name,
    @Index() String? chatId,
  }) = _ChatMessage;

  // ignore: recursive_getters
  Id get isarId => fastHash(uuid ?? id);

  @override
  @enumerated
  // ignore: recursive_getters
  Role get role => role;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => _$ChatMessageFromJson(json);
}
