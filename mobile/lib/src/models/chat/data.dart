import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';

part 'data.freezed.dart';
part 'data.g.dart';

@freezed
class ChatData with _$ChatData {
  factory ChatData({
    required Chat chat,
    required List<ChatMessage> messages,
  }) = _ChatData;

  factory ChatData.fromJson(Map<String, dynamic> json) =>
      _$ChatDataFromJson(json);
}
