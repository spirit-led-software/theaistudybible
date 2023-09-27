import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@riverpod
class CurrentChatId extends _$CurrentChatId {
  @override
  String? build() {
    return stateOrNull;
  }

  void update(String? id) {
    state = id;
  }
}
