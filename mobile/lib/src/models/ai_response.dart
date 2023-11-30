import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_response.freezed.dart';
part 'ai_response.g.dart';

@freezed
class AiResponse with _$AiResponse {
  const AiResponse._();

  factory AiResponse({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String userId,
    required String chatId,
    required String userMessageId,
    String? aiId,
    String? text,
    required bool regenerated,
    required bool failed,
  }) = _AiResponse;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory AiResponse.fromJson(Map<String, dynamic> json) => _$AiResponseFromJson(json);
}
