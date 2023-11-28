import 'package:revelationsai/src/models/ai_response/reaction.dart';
import 'package:revelationsai/src/providers/ai_response/repositories.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'reaction.g.dart';

@riverpod
class AiResponseReactions extends _$AiResponseReactions {
  @override
  FutureOr<List<AiResponseReaction>> build(String? aiResponseId) async {
    if (aiResponseId == null) {
      return const <AiResponseReaction>[];
    }

    return await ref.aiResponseReactions.getByAiResponseId(aiResponseId);
  }

  Future<void> createReaction({
    required AiResponseReactionType reactionType,
    String? comment,
  }) async {
    if (aiResponseId == null) {
      throw Exception('AI Response ID is null');
    }

    final previousState = state;

    final reaction = AiResponseReaction(
      id: const Uuid().v4(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      aiResponseId: aiResponseId!,
      userId: ref.read(currentUserProvider).requireValue.id,
      reaction: reactionType,
    );

    state = AsyncData([
      reaction,
    ]);

    return await ref.aiResponseReactions.createForAiResponseId(aiResponseId!, reactionType, comment: comment).then(
      (value) {
        refresh();
      },
    ).catchError(
      (error) {
        state = previousState;
        throw error;
      },
    );
  }

  Future<List<AiResponseReaction>> refresh() async {
    if (aiResponseId == null) {
      const reactions = <AiResponseReaction>[];
      state = const AsyncValue.data(reactions);
      return reactions;
    }

    final reactions = await ref.aiResponseReactions.refreshByAiResponseId(aiResponseId!);
    state = AsyncData(reactions);
    return reactions;
  }
}
