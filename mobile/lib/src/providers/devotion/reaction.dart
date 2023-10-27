import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/devotion/reaction.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'reaction.g.dart';

@riverpod
class DevotionReactions extends _$DevotionReactions {
  late DevotionReactionManager _manager;

  @override
  FutureOr<List<DevotionReaction>> build(String devotionId) async {
    _manager = await ref.watch(devotionReactionManagerProvider.future);
    return _manager.getDevotionReactionsByDevotionId(devotionId);
  }

  Future<void> createReaction({
    required DevotionReactionType reaction,
    required String session,
  }) async {
    return await _manager.createDevotionReactionForDevotionId(devotionId, reaction).then((value) {
      refresh();
      ref.read(devotionReactionCountsProvider(devotionId).notifier).increment(reaction);
    });
  }

  Future<List<DevotionReaction>> refresh() async {
    final reactions = await _manager.refreshDevotionReactionsByDevotionId(devotionId);
    state = AsyncData(reactions);
    return reactions;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionReactionManager> devotionReactionManager(DevotionReactionManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final user = await ref.watch(currentUserProvider.future);
  return DevotionReactionManager(isar: isar, user: user);
}

class DevotionReactionManager {
  final Isar _isar;
  final UserInfo _user;

  DevotionReactionManager({
    required Isar isar,
    required UserInfo user,
  })  : _isar = isar,
        _user = user;

  Future<bool> _hasDevotionReactionsForDevotionId(String devotionId) async {
    final messages = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<DevotionReaction>> getDevotionReactionsByDevotionId(String devotionId) async {
    if (await _hasDevotionReactionsForDevotionId(devotionId)) {
      return await _getSavedDevotionReactionsByDevotionId(devotionId);
    }

    return await _fetchDevotionReactionsByDevotionId(devotionId);
  }

  Future<List<DevotionReaction>> _getSavedDevotionReactionsByDevotionId(String devotionId) async {
    return await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionReaction>> _fetchDevotionReactionsByDevotionId(String devotionId) async {
    return await DevotionReactionService.getDevotionReactions(
      id: devotionId,
    ).then((value) async {
      await _saveDevotionReactions(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionReaction>> refreshDevotionReactionsByDevotionId(String devotionId) async {
    return await _fetchDevotionReactionsByDevotionId(devotionId);
  }

  Future<void> createDevotionReactionForDevotionId(String devotionId, DevotionReactionType type) async {
    return await DevotionReactionService.createDevotionReaction(id: devotionId, session: _user.session, reaction: type)
        .then((value) async {
      await _fetchDevotionReactionsByDevotionId(devotionId);
    });
  }

  Future<List<DevotionReaction>> _saveDevotionReactions(List<DevotionReaction> messages) async {
    await _isar.writeTxn(() async {
      await Future.wait(messages.map((e) async {
        await _isar.devotionReactions.put(e);
      }));
    });
    return messages;
  }

  Future<void> deleteSavedDevotionReactionsByDevotionId(String devotionId) async {
    if (await _hasDevotionReactionsForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.devotionReactions.delete(fastHash(e.id));
        }));
      });
    }
  }
}
