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

  void refresh() {
    ref.invalidateSelf();
  }
}
