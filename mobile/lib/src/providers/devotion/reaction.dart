import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/devotion/reaction.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction.g.dart';

@riverpod
class DevotionReactions extends _$DevotionReactions {
  @override
  FutureOr<List<DevotionReaction>> build(String devotionId) async {
    return await ref.devotionReactions.getByDevotionId(devotionId);
  }

  Future<void> createReaction({
    required DevotionReactionType reaction,
    required String session,
  }) async {
    return await ref.devotionReactions.createForDevotionId(devotionId, reaction).then((value) {
      refresh();
      ref.read(devotionReactionCountsProvider(devotionId).notifier).increment(reaction);
    });
  }

  Future<List<DevotionReaction>> refresh() async {
    final reactions = await ref.devotionReactions.refreshByDevotionId(devotionId);
    state = AsyncData(reactions);
    return reactions;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionReactionManager> devotionReactionManager(DevotionReactionManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return DevotionReactionManager(isar, session);
}

class DevotionReactionManager {
  final Isar _isar;
  final String _session;

  DevotionReactionManager(
    Isar isar,
    String session,
  )   : _isar = isar,
        _session = session;

  Future<bool> _hasLocalForDevotionId(String devotionId) async {
    final reactions = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
    return reactions.isNotEmpty;
  }

  Future<List<DevotionReaction>> getByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      return await _getLocalByDevotionId(devotionId);
    }

    return await _fetchByDevotionId(devotionId);
  }

  Future<List<DevotionReaction>> _getLocalByDevotionId(String devotionId) async {
    return await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionReaction>> _fetchByDevotionId(String devotionId) async {
    return await DevotionReactionService.getDevotionReactions(
      id: devotionId,
    ).then((value) async {
      await _save(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionReaction>> refreshByDevotionId(String devotionId) async {
    return await _fetchByDevotionId(devotionId);
  }

  Future<void> createForDevotionId(String devotionId, DevotionReactionType type) async {
    return await DevotionReactionService.createDevotionReaction(id: devotionId, session: _session, reaction: type)
        .then((value) async {
      await _fetchByDevotionId(devotionId);
    });
  }

  Future<List<int>> _save(List<DevotionReaction> reactions) async {
    return await _isar.writeTxn(() async {
      return await _isar.devotionReactions.putAll(reactions);
    });
  }

  Future<void> deleteLocalByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.devotionReactions.delete(fastHash(e.id));
        }));
      });
    }
  }
}

extension DevotionReactionsManagerX on Ref {
  DevotionReactionManager get devotionReactions => watch(devotionReactionManagerProvider).requireValue;
}
