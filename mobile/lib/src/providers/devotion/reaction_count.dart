import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/services/devotion/reaction.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction_count.g.dart';

@riverpod
class DevotionReactionCounts extends _$DevotionReactionCounts {
  @override
  FutureOr<Map<DevotionReactionType, int>> build(String id) {
    return DevotionReactionService.getDevotionReactionCounts(id: id);
  }

  void increment(DevotionReactionType type) {
    final count = state.value?[type] ?? 0;
    state = AsyncValue.data({
      ...state.value ?? {},
      type: count + 1,
    });
    refresh();
  }

  void decrement(DevotionReactionType type) {
    final count = state.value?[type] ?? 1;
    state = AsyncValue.data({
      ...state.value ?? {},
      type: count - 1,
    });
    refresh();
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
