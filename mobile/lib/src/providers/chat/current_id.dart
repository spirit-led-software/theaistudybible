import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@Riverpod(keepAlive: true)
class CurrentChatId extends _$CurrentChatId {
  @override
  String? build() {
    return stateOrNull;
  }

  void update(String? id) {
    state = id;
  }
}
