import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@Riverpod(keepAlive: true)
class CurrentDevotionId extends _$CurrentDevotionId {
  @override
  FutureOr<String?> build() async {
    if (state.value == null) {
      return (await ref.watch(devotionsPagesProvider.future))
          .firstOrNull
          ?.firstOrNull
          ?.id;
    }
    return state.value;
  }

  Future<void> updateId(String? id) async {
    if (id == null) {
      state = AsyncData((await ref.watch(devotionsPagesProvider.future))
          .firstOrNull
          ?.firstOrNull
          ?.id);
    } else {
      state = AsyncData(id);
    }
  }
}
