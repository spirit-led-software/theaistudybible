import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/single.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@riverpod
class CurrentChatId extends _$CurrentChatId {
  @override
  String? build() {
    if (stateOrNull != null) {
      ref.watch(singleChatProvider(stateOrNull!));
      ref.watch(chatMessagesProvider(stateOrNull!));
    }
    return stateOrNull;
  }

  void update(String? id) {
    state = id;
  }
}
