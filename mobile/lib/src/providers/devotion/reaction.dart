import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

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
    required DevotionReactionType reactionType,
    String? comment,
  }) async {
    final previousState = state;

    final reaction = DevotionReaction(
      id: const Uuid().v4(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      devotionId: _id,
      userId: ref.read(currentUserProvider).requireValue.id,
      reaction: reactionType,
    );

    state = AsyncData([
      if (state.hasValue) ...state.requireValue,
      reaction,
    ]);

    return await ref.devotionReactions.createForDevotionId(_id, reactionType, comment: comment).then(
      (value) {
        refresh();
        ref.read(devotionReactionCountsProvider(_id).notifier).increment(reactionType);
      },
    ).catchError(
      (error) {
        state = previousState;
        throw error;
      },
    );
  }

  Future<List<DevotionReaction>> refresh() async {
    final reactions = await ref.devotionReactions.refreshByDevotionId(_id);
    state = AsyncData(reactions);
    return reactions;
  }
}
