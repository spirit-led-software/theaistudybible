import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction_count.g.dart';

@riverpod
class DevotionReactionCounts extends _$DevotionReactionCounts {
  @override
  FutureOr<Map<DevotionReactionType, int>> build(String? id) async {
    id ??= (await ref.devotions.getPage(const PaginatedEntitiesRequestOptions(page: 1, limit: 1))).first.id;

    ref.onAddListener(() {
      refresh();
    });

    return await ref.devotionReactions.getCountsForDevotionId(id);
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

  Future<Map<DevotionReactionType, int>> refresh() async {
    final counts = await ref.devotionReactions.refreshCountsForDevotionId(id!);
    state = AsyncValue.data(counts);
    return counts;
  }
}
