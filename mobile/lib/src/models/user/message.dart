import 'package:freezed_annotation/freezed_annotation.dart';

part 'message.freezed.dart';
part 'message.g.dart';

@freezed
class UserMessage with _$UserMessage {
  const UserMessage._();

  factory UserMessage({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String chatId,
    required String userId,
    String? aiId,
    required String text,
  }) = _UserMessage;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory UserMessage.fromJson(Map<String, dynamic> json) => _$UserMessageFromJson(json);
}
