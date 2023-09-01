import 'package:freezed_annotation/freezed_annotation.dart';

part 'chat_request.freezed.dart';
part 'chat_request.g.dart';

@freezed
class CreateChatRequest with _$CreateChatRequest {
  factory CreateChatRequest({
    required String name,
  }) = _CreateChatRequest;

  factory CreateChatRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateChatRequestFromJson(json);
}

@freezed
class UpdateChatRequest with _$UpdateChatRequest {
  factory UpdateChatRequest({
    required String name,
  }) = _UpdateChatRequest;

  factory UpdateChatRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateChatRequestFromJson(json);
}
