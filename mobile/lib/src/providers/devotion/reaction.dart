import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/services/devotion/reaction.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction.g.dart';

@riverpod
class DevotionReactions extends _$DevotionReactions {
  @override
  FutureOr<List<DevotionReaction>> build(String id) {
    return DevotionReactionService.getDevotionReactions(id: id)
        .then((value) => value.entities);
  }

  Future<void> createReaction({
    required DevotionReactionType reaction,
    required String session,
  }) async {
    return DevotionReactionService.createDevotionReaction(
      id: id,
      reaction: reaction,
      session: session,
    ).then((value) {
      refresh();
      ref.read(devotionReactionCountsProvider(id).notifier).increment(reaction);
    });
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
