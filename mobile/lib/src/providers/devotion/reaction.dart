import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction.g.dart';

@riverpod
class DevotionReactions extends _$DevotionReactions {
  late String _id;

  @override
  FutureOr<List<DevotionReaction>> build(String? devotionId) async {
    _id = devotionId ?? (await ref.devotions.getLatest()).id;

    return await ref.devotionReactions.getByDevotionId(_id);
  }

  Future<void> createReaction({
    required DevotionReactionType reaction,
    required String session,
  }) async {
    return await ref.devotionReactions.createForDevotionId(_id, reaction).then((value) {
      refresh();
      ref.read(devotionReactionCountsProvider(_id).notifier).increment(reaction);
    });
  }

  Future<List<DevotionReaction>> refresh() async {
    final reactions = await ref.devotionReactions.refreshByDevotionId(_id);
    state = AsyncData(reactions);
    return reactions;
  }
}
