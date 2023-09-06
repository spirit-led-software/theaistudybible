import 'package:freezed_annotation/freezed_annotation.dart';

part 'message.freezed.dart';
part 'message.g.dart';

@freezed
class UserMessage with _$UserMessage {
  factory UserMessage({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String chatId,
    required String userId,
    String? aiId,
    required String text,
  }) = _UserMessage;

  factory UserMessage.fromJson(Map<String, dynamic> json) =>
      _$UserMessageFromJson(json);
}
