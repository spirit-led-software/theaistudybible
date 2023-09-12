import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_response.freezed.dart';
part 'ai_response.g.dart';

@freezed
class AiResponse with _$AiResponse {
  factory AiResponse({
    /* Convert from TypeScript:
    type AiResponse = {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        failed: boolean;
        userId: string;
        aiId: string | null;
        text: string | null;
        regenerated: boolean;
        chatId: string;
        userMessageId: string;
    }
    */
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

  factory AiResponse.fromJson(Map<String, dynamic> json) =>
      _$AiResponseFromJson(json);
}
